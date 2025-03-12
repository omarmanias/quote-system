import nodemailer from 'nodemailer';
import type { Quote, QuoteItem, Product } from '@shared/schema';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // This should be an app-specific password
  }
});

export async function sendQuoteApprovalEmail(quote: Quote, items: QuoteItem[], products: Product[]) {
  try {
    // Format items for email
    const itemsList = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return `
        - ${product?.name}
        - Quantity: ${item.quantity}
        - Unit Price: $${Number(item.unitPrice).toFixed(2)}
        - Subtotal: $${Number(item.subtotal).toFixed(2)}
      `;
    }).join('\n');

    // Create email content
    const emailContent = `
      Dear ${quote.customerName},

      Your quote #${quote.id} has been approved. Here are the details:

      Quote Details:
      - Total Amount: $${Number(quote.total).toFixed(2)}
      - Tax Amount: $${Number(quote.taxAmount).toFixed(2)}
      - Status: ${quote.status}

      Items:
      ${itemsList}

      Thank you for your business!
    `;

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: quote.customerEmail,
      subject: `Quote #${quote.id} Approved`,
      text: emailContent,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
