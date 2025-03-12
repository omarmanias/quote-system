import { Router } from "express";
import { storage } from "../storage";
import { insertCategorySchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// Get all categories
router.get("/categories", async (_req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
});

// Get single category
router.get("/categories/:id", async (req, res) => {
  // Handle 'undefined' or invalid id
  if (!req.params.id || req.params.id === 'undefined') {
    return res.status(404).json({ message: "Category not found" });
  }

  // If the ID is "all", return all categories
  if (req.params.id.toLowerCase() === 'all') {
    const categories = await storage.getCategories();
    return res.json(categories);
  }

  // Try to get category by ID
  const category = await storage.getCategory(Number(req.params.id));
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(category);
});

// Get category by name
router.get("/categories/name/:name", async (req, res) => {
  const category = await storage.getCategoryByName(req.params.name);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(category);
});

// Get category children
router.get("/categories/:id/children", async (req, res) => {
  const children = await storage.getCategoryChildren(Number(req.params.id));
  res.json(children);
});

// Create category
router.post("/categories", async (req, res) => {
  try {
    const data = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory(data);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Update category
router.patch("/categories/:id", async (req, res) => {
  try {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const data = insertCategorySchema.partial().parse(req.body);
    const updatedCategory = await storage.updateCategory(category.id, data);
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  const deleted = await storage.deleteCategory(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.status(204).send();
});

export default router;