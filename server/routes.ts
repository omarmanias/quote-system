import type { Express } from "express";
import { createServer, type Server } from "http";
import usersRouter from "./api/users";
import productsRouter from "./api/products";
import categoriesRouter from "./api/categories";
import quotesRouter from "./api/quotes";
import templatesRouter from "./api/templates";
import customersRouter from "./api/customers";
import settingsRouter from "./api/settings";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Register API routes
  app.use("/api", usersRouter);
  app.use("/api", productsRouter);
  app.use("/api", categoriesRouter);
  app.use("/api", quotesRouter);
  app.use("/api", templatesRouter);
  app.use("/api", customersRouter);
  app.use("/api", settingsRouter);

  const httpServer = createServer(app);
  return httpServer;
}