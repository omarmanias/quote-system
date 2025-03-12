import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import { s3Service } from "../services/s3";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test S3 connection
router.get("/products/test-s3", async (_req, res) => {
  try {
    const testResult = await s3Service.testConnection();
    res.json(testResult);
  } catch (error) {
    console.error('Error testing S3 connection:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to test S3 connection' 
    });
  }
});

// Get all products
router.get("/products", async (_req, res) => {
  const products = await storage.getProducts();
  res.json(products);
});

// Get single product
router.get("/products/:id", async (req, res) => {
  const product = await storage.getProduct(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

// Create product with multiple images
router.post("/products", upload.array('images'), async (req, res) => {
  try {
    console.log('Creating product with request files:', req.files); // Debug log

    const files = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];

    // Upload images to S3
    if (files && files.length > 0) {
      console.log(`Uploading ${files.length} files to S3`); // Debug log
      for (const file of files) {
        console.log('Uploading file:', file.originalname); // Debug log
        const imageUrl = await s3Service.uploadImage(file);
        console.log('Got S3 URL:', imageUrl); // Debug log
        imageUrls.push(imageUrl);
      }
    } else {
      console.log('No files received in request'); // Debug log
    }

    console.log('Final image URLs:', imageUrls); // Debug log

    const data = insertProductSchema.parse({
      ...req.body,
      imageUrls,
      price: parseFloat(req.body.price)
    });

    const product = await storage.createProduct(data);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Update product
router.patch("/products/:id", upload.array('images'), async (req, res) => {
  try {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log('Form Data:', req.body);
    console.log('Files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);

    const files = req.files as Express.Multer.File[];
    let allImageUrls: string[] = [];

    // Handle existing images
    if (req.body.imageUrls) {
      try {
        allImageUrls = JSON.parse(req.body.imageUrls);
        console.log('Parsed existing imageUrls:', allImageUrls);
      } catch (e) {
        console.error('Error parsing imageUrls:', e);
        allImageUrls = [];
      }
    }

    // Upload new images to S3
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} new files`);
      for (const file of files) {
        try {
          console.log('Processing file:', file.originalname);
          const imageUrl = await s3Service.uploadImage(file);
          console.log('Uploaded successfully, URL:', imageUrl);
          if (imageUrl) {
            allImageUrls.push(imageUrl);
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          return res.status(500).json({ message: 'Failed to upload image to S3' });
        }
      }
    }

    // Update the product with new data including images
    const data = insertProductSchema.partial().parse({
      ...req.body,
      imageUrls: allImageUrls,
      ...(req.body.price && { price: parseFloat(req.body.price) })
    });

    const updatedProduct = await storage.updateProduct(product.id, data);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Failed to update product" });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Note: We're not deleting images from S3 as they might be referenced elsewhere
    // If needed, implement S3 deletion logic here

    const deleted = await storage.deleteProduct(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;