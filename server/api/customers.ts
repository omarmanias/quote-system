import { Router } from "express";
import { storage } from "../storage";
import { insertCustomerSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// Get all customers
router.get("/customers", async (_req, res) => {
  const customers = await storage.getCustomers();
  res.json(customers);
});

// Get single customer
router.get("/customers/:id", async (req, res) => {
  const customer = await storage.getCustomer(Number(req.params.id));
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
});

// Create customer
router.post("/customers", async (req, res) => {
  try {
    const data = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(data);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

export default router;
