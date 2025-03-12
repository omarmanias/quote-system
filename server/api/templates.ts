import { Router } from "express";
import { storage } from "../storage";
import { insertQuoteTemplateSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// Get all templates
router.get("/quote-templates", async (_req, res) => {
  const templates = await storage.getQuoteTemplates();
  res.json(templates);
});

// Get templates by category
router.get("/quote-templates/category/:id", async (req, res) => {
  const templates = await storage.getQuoteTemplatesByCategory(Number(req.params.id));
  res.json(templates);
});

// Create template
router.post("/quote-templates", async (req, res) => {
  try {
    const data = insertQuoteTemplateSchema.parse(req.body);
    const template = await storage.createQuoteTemplate(data);
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Update template
router.patch("/quote-templates/:id", async (req, res) => {
  try {
    const template = await storage.getQuoteTemplate(Number(req.params.id));
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const data = insertQuoteTemplateSchema.partial().parse(req.body);
    const updatedTemplate = await storage.updateQuoteTemplate(template.id, data);
    res.json(updatedTemplate);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Delete template
router.delete("/quote-templates/:id", async (req, res) => {
  const deleted = await storage.deleteQuoteTemplate(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ message: "Template not found" });
  }
  res.status(204).send();
});

export default router;
