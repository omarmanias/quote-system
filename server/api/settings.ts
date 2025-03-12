import { Router } from "express";
import { storage } from "../storage";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for logo upload
const uploadDir = path.join(__dirname, '../../client/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'company-logo-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images Only!"));
  }
});

// Authentication and company access middleware
const requireCompanyAccess = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure user has access to the company
  if (!req.user.companyId) {
    return res.status(403).json({ message: "No company access" });
  }

  next();
};

// Get company settings - only accessible by company users
router.get("/company/settings", requireCompanyAccess, async (req, res) => {
  try {
    const company = await storage.getCompany(req.user!.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: "Failed to fetch company settings" });
  }
});

// Update company settings - only accessible by company users
router.put("/company/settings", requireCompanyAccess, upload.single('logo'), async (req, res) => {
  try {
    const company = await storage.getCompany(req.user!.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Ensure the user is updating their own company
    if (company.id !== req.user!.companyId) {
      return res.status(403).json({ message: "Not authorized to update this company's settings" });
    }

    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    // Handle logo upload
    let logoUrl = company.logoUrl;
    if (req.file) {
      // Delete old logo if it exists
      if (company.logoUrl) {
        const oldLogoPath = path.join(uploadDir, path.basename(company.logoUrl));
        try {
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
          }
        } catch (err) {
          console.error('Error deleting old logo:', err);
        }
      }
      logoUrl = `/uploads/${req.file.filename}`;
    }

    const updateData = {
      name: req.body.name,
      logoUrl
    };

    const updatedCompany = await storage.updateCompany(company.id, updateData);
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: "Failed to update company settings" });
  }
});

export default router;