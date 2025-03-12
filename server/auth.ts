import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { insertCompanySchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import type { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function initializeDefaultAdmin() {
  try {
    // Skip if SKIP_SEEDING is set
    if (process.env.SKIP_SEEDING === 'true') {
      console.log('Skipping admin initialization due to SKIP_SEEDING flag');
      return;
    }

    // Check if any users exist
    const users = await storage.getUsers();
    if (users.length > 0) {
      console.log('Default admin initialization skipped: Users already exist');
      return; // Skip initialization if users exist
    }

    // Create default admin company
    const adminCompany = await storage.createCompany({
      name: "Admin Company",
      logoUrl: "/default-logo.png", // Provide a default logo
    });
    console.log('Created admin company:', { id: adminCompany.id, name: adminCompany.name });

    // Create default admin user
    const adminUser = await storage.createUser({
      firstName: "Admin",
      lastName: "User",
      email: "admin@quotesystem.com",
      password: await hashPassword("123456"),
      role: "ADMIN",
      companyId: adminCompany.id,
    });

    console.log('Created default admin user:', { 
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      companyId: adminUser.companyId
    });
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
}

export async function setupAuth(app: Express) {
  console.log('Setting up authentication...');
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    }, async (req, email, password, done) => {
      try {
        const companyName = req.body.companyName;
        console.log('Login attempt:', { email, companyName, password: '***' });

        const company = await storage.getCompanyByName(companyName);
        if (!company) {
          console.log('Login failed: Company not found');
          return done(null, false);
        }

        const user = await storage.getUserByEmailAndCompany(email, company.id);
        console.log('Found user:', user ? { ...user, password: '[HIDDEN]' } : 'null');

        if (!user) {
          console.log('Login failed: User not found');
          return done(null, false);
        }

        const isValidPassword = await comparePasswords(password, user.password);
        console.log('Password validation:', { isValid: isValidPassword });

        if (!isValidPassword) {
          console.log('Login failed: Invalid password');
          return done(null, false);
        }

        console.log('Login successful for user:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  // Initialize default admin if needed
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting admin initialization check...');
    await initializeDefaultAdmin();
  }

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // First, create or get company
      const companyData = insertCompanySchema.parse({
        name: req.body.companyName,
        logoUrl: req.body.logoUrl || '/default-logo.png', // Provide a default logo
      });

      let company = await storage.getCompanyByName(companyData.name);
      if (!company) {
        company = await storage.createCompany(companyData);
      }

      // Then create user
      const userData = insertUserSchema.parse({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: await hashPassword(req.body.password),
        role: req.body.role,
        companyId: company.id,
      });

      const existingUser = await storage.getUserByEmailAndCompany(
        userData.email,
        company.id
      );
      if (existingUser) {
        return res.status(400).json({ message: "User already exists in this company" });
      }

      const user = await storage.createUser(userData);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}