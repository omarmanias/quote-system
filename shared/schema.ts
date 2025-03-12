import { pgTable, text, serial, integer, timestamp, numeric, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Update company schema to remove code requirement
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Update users table to include companyId
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Existing tables
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => categories.id),
});

// Update product table to include image URLs as JSON
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  unit: text("unit").notNull(),
  categoryName: text("category_name"),
  imageUrls: json("image_urls").$type<string[]>(), // Store array of image URLs
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
});

// New tables for quotes
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
});

export const quoteTemplates = pgTable("quote_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  content: text("content").notNull(),
});

// Define the QuoteItem type for the JSON field
export const quoteItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
  subtotal: z.string(),
});

export type QuoteItem = z.infer<typeof quoteItemSchema>;

// Update quote table to remove foreign keys
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  templateName: text("template_name"),
  categoryName: text("category_name"),
  status: text("status").notNull(),
  subtotal: numeric("subtotal").notNull(),
  taxPercentage: numeric("tax_percentage").default("0"),
  taxAmount: numeric("tax_amount").notNull(),
  total: numeric("total").notNull(),
  advancePayment: numeric("advance_payment").default("0"),
  digitalSignature: text("digital_signature"),
  signedAt: text("signed_at"),
  items: json("items").$type<QuoteItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Update company schemas to reflect required fields
export const insertCompanySchema = createInsertSchema(companies)
  .pick({
    name: true,
    logoUrl: true,
  })
  .extend({
    name: z.string().min(1, "Company name is required"),
    logoUrl: z.string().min(1, "Company logo is required"),
  });

// Update user schema
export const insertUserSchema = createInsertSchema(users)
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    password: true,
    role: true,
    companyId: true,
  })
  .extend({
    role: z.enum(['ADMIN', 'USER']),
    email: z.string().email("Invalid email format"),
  });

// Update schemas
export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  parentId: true,
});

// Update the insert schemas
export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  unit: true,
  categoryName: true,
  imageUrls: true,
}).extend({
  imageUrls: z.array(z.string()).optional(),
  price: z.number().or(z.string().transform(val => parseFloat(val))),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).pick({
  productId: true,
  name: true,
  price: true,
});


// New schemas for quotes
export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
});

export const insertQuoteTemplateSchema = createInsertSchema(quoteTemplates).pick({
  name: true,
  categoryId: true,
  content: true,
});

// Updated insertQuoteSchema to match new structure
export const insertQuoteSchema = createInsertSchema(quotes)
  .pick({
    customerName: true,
    customerEmail: true,
    templateName: true,
    categoryName: true,
    status: true,
    subtotal: true,
    taxPercentage: true,
    taxAmount: true,
    total: true,
    advancePayment: true,
    digitalSignature: true,
    items: true,
  })
  .extend({
    signedAt: z.string().nullable().optional(),
    items: z.array(quoteItemSchema),
  });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertQuoteTemplate = z.infer<typeof insertQuoteTemplateSchema>;
export type QuoteTemplate = typeof quoteTemplates.$inferSelect;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

import { numeric } from "drizzle-orm/pg-core";