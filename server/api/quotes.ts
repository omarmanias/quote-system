import { Router } from "express";
import { storage } from "../storage";
import { insertQuoteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { sendQuoteApprovalEmail } from "../services/email";
import crypto from 'crypto';

const router = Router();

// Helper function to verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

// Helper function to retry webhook delivery
async function retryWebhookDelivery(endpoint: string, payload: any, maxRetries = 3): Promise<Response> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": crypto
            .createHmac('sha256', process.env.WEBHOOK_SECRET || 'default-secret')
            .update(JSON.stringify(payload))
            .digest('hex')
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) return response;
      lastError = new Error(`Webhook failed with status: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError;
}

// Helper function to prepare webhook payload
function prepareWebhookPayload(quote: any) {
  return {
    id: quote.id,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    total: quote.total,
    status: quote.status,
    createdAt: quote.createdAt,
    items: quote.items.map((item: any) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }))
  };
}

// Helper function to send webhook
async function sendWebhook(quote: any, requestId: string) {
  const zapierEndpoint = "https://hooks.zapier.com/hooks/catch/18867224/2qjr1yn/";
  console.log(`[${requestId}] Sending webhook to Zapier`);

  const webhookPayload = prepareWebhookPayload(quote);
  await retryWebhookDelivery(zapierEndpoint, webhookPayload);
  console.log(`[${requestId}] Webhook sent successfully for quote:`, quote.id);
}

// Get all quotes
router.get("/quotes", async (_req, res) => {
  const quotes = await storage.getQuotes();
  res.json(quotes);
});

// Get single quote
router.get("/quotes/:id", async (req, res) => {
  const quote = await storage.getQuote(Number(req.params.id));
  if (!quote) {
    return res.status(404).json({ message: "Quote not found" });
  }
  res.json(quote);
});

// Create quote
router.post("/quotes", async (req, res) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Creating new quote`);

  try {
    const data = insertQuoteSchema.parse(req.body);
    const quote = await storage.createQuote(data);

    // Send webhook notification
    try {
      await sendWebhook(quote, requestId);
    } catch (webhookError) {
      console.error(`[${requestId}] Failed to send webhook:`, webhookError);
      // Don't fail the request if webhook fails
    }

    res.status(201).json(quote);
  } catch (error) {
    console.error(`[${requestId}] Error creating quote:`, error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

// Update quote
router.patch("/quotes/:id", async (req, res) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Updating quote ${req.params.id}`);

  try {
    const quote = await storage.getQuote(Number(req.params.id));
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    const data = insertQuoteSchema.partial().parse(req.body);
    const updatedQuote = await storage.updateQuote(quote.id, data);

    // If quote status is changed to APPROVED, send email notification
    if (data.status === "APPROVED" && updatedQuote) {
      try {
        // Get products for the email
        const products = await storage.getProducts();
        await sendQuoteApprovalEmail(updatedQuote, updatedQuote.items, products);
      } catch (emailError) {
        console.error(`[${requestId}] Failed to send approval email:`, emailError);
        // Don't fail the request if email sending fails
      }

      // Send webhook notification for status change
      try {
        await sendWebhook(updatedQuote, requestId);
      } catch (webhookError) {
        console.error(`[${requestId}] Failed to send webhook:`, webhookError);
        // Don't fail the request if webhook fails
      }
    }

    res.json(updatedQuote);
  } catch (error) {
    console.error(`[${requestId}] Error updating quote:`, error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    throw error;
  }
});

// Delete quote
router.delete("/quotes/:id", async (req, res) => {
  const deleted = await storage.deleteQuote(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ message: "Quote not found" });
  }
  res.status(204).send();
});

// Webhook new quotes with improved validation and logging
router.post("/webhook/new-quote", async (req, res) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Receiving webhook request for new quote`);

  try {
    // Verify webhook signature if present
    const signature = req.headers['x-webhook-signature'];
    if (signature && typeof signature === 'string') {
      const isValid = verifyWebhookSignature(
        JSON.stringify(req.body),
        signature,
        process.env.WEBHOOK_SECRET || 'default-secret'
      );
      if (!isValid) {
        console.error(`[${requestId}] Invalid webhook signature`);
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature"
        });
      }
    }

    // Validate incoming data
    const data = insertQuoteSchema.parse(req.body);

    // Create quote in database
    const newQuote = await storage.createQuote(data);
    console.log(`[${requestId}] New quote created:`, {
      quoteId: newQuote.id,
      customerName: newQuote.customerName,
      total: newQuote.total
    });

    // Send webhook notification
    await sendWebhook(newQuote, requestId);

    // Return success response with quote details
    res.status(201).json({
      success: true,
      requestId,
      message: "Quote created and webhook sent successfully",
      quote: newQuote
    });

  } catch (error) {
    console.error(`[${requestId}] Webhook error:`, error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        requestId,
        message: "Invalid quote data",
        errors: error.errors
      });
    }

    // Handle other types of errors
    return res.status(500).json({
      success: false,
      requestId,
      message: "Failed to process webhook",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;