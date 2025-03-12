import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import type { Quote, QuoteItem, Product, Company } from "@shared/schema";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
    marginRight: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 5,
  },
  quoteTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: "#2563eb",
  },
  quoteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8fafc",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
    textTransform: "uppercase",
  },
  customerInfo: {
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  infoRow: {
    marginBottom: 5,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCell2: {
    flex: 2,
  },
  totalsSection: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: "right",
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#2563eb",
  },
  termsSection: {
    marginTop: 50,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
  },
  termsContent: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
  },
  signature: {
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 20,
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
  },
  signatureImage: {
    marginTop: 10,
    height: 100,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#64748b",
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  systemName: {
    fontSize: 28,
    color: "#1e293b",
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

interface QuotePDFProps {
  quote: Quote;
  items: QuoteItem[];
  products: Product[];
  category: {
    name: string;
    description: string;
  };
  templateContent: string;
  company: Company;
}

const QuoteDocument = ({
  quote,
  items,
  products,
  category,
  templateContent,
  company,
}: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section with Company Logo and Info */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {company?.logoUrl && (
            <Image src={company.logoUrl} style={styles.logo} />
          )}
        </View>

        <View style={styles.quoteInfo}>
          <View>
            <Text>Date: {new Date(quote.createdAt).toLocaleDateString()}</Text>
            <Text>Status: {quote.status}</Text>
          </View>
          <View>
            <Text>Quote No.: {quote.id}</Text>
            <Text>Category: {category.name}</Text>
          </View>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.customerInfo}>
          <Text style={styles.infoRow}>Name: {quote.customerName}</Text>
          <Text style={styles.infoRow}>Email: {quote.customerEmail}</Text>
        </View>
      </View>

      {/* Products Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCell2}>Product</Text>
            <Text style={styles.tableCell}>Quantity</Text>
            <Text style={styles.tableCell}>Unit Price</Text>
            <Text style={styles.tableCell}>Subtotal</Text>
          </View>
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell2}>{product?.name}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>
                  ${Number(item.unitPrice).toFixed(2)}
                </Text>
                <Text style={styles.tableCell}>
                  ${Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>
            ${Number(quote.subtotal).toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Taxes ({Number(quote.taxPercentage)}%):
          </Text>
          <Text style={styles.totalValue}>
            ${Number(quote.taxAmount).toFixed(2)}
          </Text>
        </View>
        {Number(quote.advancePayment) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Advance Payment:</Text>
            <Text style={styles.totalValue}>
              -${Number(quote.advancePayment).toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ${Number(quote.total).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Terms and Conditions Section */}
      {templateContent && (
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms and Conditions</Text>
          <Text style={styles.termsContent}>{templateContent}</Text>
        </View>
      )}

      {/* Signature Section */}
      {quote.status === "APPROVED" && quote.digitalSignature && (
        <View style={styles.signature}>
          <Text style={styles.signatureTitle}>Digital Signature</Text>
          <Text>Signed on: {new Date(quote.signedAt!).toLocaleString()}</Text>
          <Image style={styles.signatureImage} src={quote.digitalSignature} />
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        This quote is valid for 30 days from the issue date.
      </Text>
    </Page>
  </Document>
);

export const generateQuotePDF = async (props: QuotePDFProps) => {
  try {
    return await pdf(<QuoteDocument {...props} />).toBlob();
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

export default QuoteDocument;
