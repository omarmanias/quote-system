import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

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

// Get users for the current user's company
router.get("/users", requireCompanyAccess, async (req, res) => {
  try {
    const users = await storage.getUsersByCompany(req.user.companyId);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get single user (only if in same company)
router.get("/users/:id", requireCompanyAccess, async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user belongs to the same company
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ message: "Not authorized to access this user" });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update user (only if in same company)
router.patch("/users/:id", requireCompanyAccess, async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user belongs to the same company
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ message: "Not authorized to update this user" });
    }

    const data = insertUserSchema.partial().parse(req.body);
    const updatedUser = await storage.updateUser(user.id, data);
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user (only if in same company)
router.delete("/users/:id", requireCompanyAccess, async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user belongs to the same company
    if (user.companyId !== req.user.companyId) {
      return res.status(403).json({ message: "Not authorized to delete this user" });
    }

    const deleted = await storage.deleteUser(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Create user (automatically assigns to current user's company)
router.post("/users", requireCompanyAccess, async (req, res) => {
  try {
    const data = insertUserSchema.parse({
      ...req.body,
      companyId: req.user.companyId // Ensure new user is assigned to current company
    });

    const existingUser = await storage.getUserByEmailAndCompany(data.email, req.user.companyId);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this company" });
    }

    const user = await storage.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

export default router;