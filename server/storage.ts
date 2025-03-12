import { users, companies, categories, products, productVariants, customers, quoteTemplates, quotes, type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type ProductVariant, type InsertProductVariant, type Customer, type InsertCustomer, type QuoteTemplate, type InsertQuoteTemplate, type Quote, type InsertQuote, type Company, type InsertCompany } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailAndCompany(email: string, companyId: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByCompany(companyId: number): Promise<User[]>; // Added here

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  getCategoryChildren(id: number): Promise<Category[]>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Product Variant methods
  getProductVariant(id: number): Promise<ProductVariant | undefined>;
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: number): Promise<boolean>;

  // Customer methods
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Quote Template methods
  getQuoteTemplate(id: number): Promise<QuoteTemplate | undefined>;
  getQuoteTemplates(): Promise<QuoteTemplate[]>;
  getQuoteTemplatesByCategory(categoryId: number): Promise<QuoteTemplate[]>;
  createQuoteTemplate(template: InsertQuoteTemplate): Promise<QuoteTemplate>;
  updateQuoteTemplate(id: number, template: Partial<InsertQuoteTemplate>): Promise<QuoteTemplate | undefined>;
  deleteQuoteTemplate(id: number): Promise<boolean>;

  // Quote methods
  getQuote(id: number): Promise<Quote | undefined>;
  getQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;

  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  deleteAllUsers(): Promise<void>;
  deleteAllCompanies(): Promise<void>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  getCompanyByName(name: string): Promise<Company | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();
      return !!deletedProduct;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmailAndCompany(email: string, companyId: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.companyId, companyId)));

    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }

  async getUsersByCompany(companyId: number): Promise<User[]> { // Added function
    return await db.select()
      .from(users)
      .where(eq(users.companyId, companyId));
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    if (!id || isNaN(id)) {
      return undefined;
    }
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    if (!name) {
      return undefined;
    }
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async getCategoryChildren(id: number): Promise<Category[]> {
    if (!id || isNaN(id)) {
      return [];
    }
    return await db.select().from(categories).where(eq(categories.parentId, id));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

      if (!category) {
        return false;
      }

      const [deletedCategory] = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();

      return !!deletedCategory;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  // Product Variant methods
  async getProductVariant(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return variant || undefined;
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  }

  async createProductVariant(insertVariant: InsertProductVariant): Promise<ProductVariant> {
    const [variant] = await db
      .insert(productVariants)
      .values(insertVariant)
      .returning();
    return variant;
  }

  async updateProductVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updatedVariant] = await db
      .update(productVariants)
      .set(variant)
      .where(eq(productVariants.id, id))
      .returning();
    return updatedVariant;
  }

  async deleteProductVariant(id: number): Promise<boolean> {
    const [deletedVariant] = await db
      .delete(productVariants)
      .where(eq(productVariants.id, id))
      .returning();
    return !!deletedVariant;
  }

  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    return !!deletedCustomer;
  }

  // Quote Template methods
  async getQuoteTemplate(id: number): Promise<QuoteTemplate | undefined> {
    const [template] = await db.select().from(quoteTemplates).where(eq(quoteTemplates.id, id));
    return template || undefined;
  }

  async getQuoteTemplates(): Promise<QuoteTemplate[]> {
    return await db.select().from(quoteTemplates);
  }

  async getQuoteTemplatesByCategory(categoryId: number): Promise<QuoteTemplate[]> {
    return await db.select().from(quoteTemplates).where(eq(quoteTemplates.categoryId, categoryId));
  }

  async createQuoteTemplate(insertTemplate: InsertQuoteTemplate): Promise<QuoteTemplate> {
    const [template] = await db
      .insert(quoteTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateQuoteTemplate(id: number, template: Partial<InsertQuoteTemplate>): Promise<QuoteTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(quoteTemplates)
      .set(template)
      .where(eq(quoteTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteQuoteTemplate(id: number): Promise<boolean> {
    const [deletedTemplate] = await db
      .delete(quoteTemplates)
      .where(eq(quoteTemplates.id, id))
      .returning();
    return !!deletedTemplate;
  }

  // Quote methods
  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    return quote;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set(quote)
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: number): Promise<boolean> {
    const [deletedQuote] = await db
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning();
    return !!deletedQuote;
  }


  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.code, code));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }
  async deleteAllUsers(): Promise<void> {
    await db.delete(users);
  }

  async deleteAllCompanies(): Promise<void> {
    await db.delete(companies);
  }
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }
  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.name, name));
    return company || undefined;
  }
}

export const storage = new DatabaseStorage();