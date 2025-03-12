import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Checkbox,
} from "antd";
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import type { Quote, Category, Product, ProductVariant } from "@shared/schema";
import { quoteService } from "@/services/quotes";
import { categoryService } from "@/services/categories";
import { productService } from "@/services/products";

function generateGoogleCalendarUrl(quote: {
  customerName: string;
  total: number;
  id: number;
}) {
  const event = {
    text: `Quote #${quote.id} Follow-up with ${quote.customerName}`,
    details: `Follow up on approved quote #${quote.id} for ${quote.customerName}\nTotal Amount: $${quote.total}`,
    dates: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  };

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.text);
  url.searchParams.append('details', event.details);
  url.searchParams.append('dates', `${event.dates}/${event.dates}`);

  return url.toString();
}

const { Option } = Select;

interface QuoteTemplate {
  id: number;
  name: string;
  // Add other properties as needed
}

interface QuoteFormProps {
  quote?: Quote;
  categories: Category[];
  products: Product[];
  templates: QuoteTemplate[];
  onSuccess: () => void;
}

interface SelectedProduct {
  id: number;
  variantId?: number;
  quantity: number;
  price: number;
  name?: string;
  variantName?: string;
}

export default function QuoteForm({
  quote,
  categories,
  products,
  templates,
  onSuccess,
}: QuoteFormProps) {
  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [loading, setIsLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "all",
  ]);
  const [productVariants, setProductVariants] = useState<
    Record<number, ProductVariant[]>
  >({});
  const signatureRef = useRef<any>(null);

  // Filter products based on selected categories
  const filteredProducts = useMemo(() => {
    if (selectedCategories.includes("all")) {
      return products;
    }
    return products.filter(
      (p) => p.categoryName && selectedCategories.includes(p.categoryName),
    );
  }, [selectedCategories, products]);

  // Load variants for each product
  useEffect(() => {
    const loadVariants = async () => {
      const variantsMap: Record<number, ProductVariant[]> = {};
      for (const product of products) {
        const variants = await productService.getProductVariants(product.id);
        if (variants.length > 0) {
          variantsMap[product.id] = variants;
        }
      }
      setProductVariants(variantsMap);
    };
    loadVariants();
  }, [products]);

  // Initialize form with quote data when editing
  useEffect(() => {
    if (quote) {
      form.setFieldsValue({
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        templateName: quote.templateName,
        status: quote.status,
        taxPercentage: Number(quote.taxPercentage) || 0,
        advancePayment: Number(quote.advancePayment) || 0,
        subtotal: Number(quote.subtotal) || 0,
        taxAmount: Number(quote.taxAmount) || 0,
        total: Number(quote.total) || 0,
      });

      // Initialize selected products from quote items
      const productsFromItems = quote.items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        name: item.productName,
      }));
      setSelectedProducts(productsFromItems);

      // Initialize selected categories from quote
      if (quote.categoryName) {
        if (quote.categoryName === "All Categories") {
          setSelectedCategories(["all"]);
        } else {
          const categoryNames = quote.categoryName.split(", ");
          setSelectedCategories(categoryNames);
        }
      }

      // Show signature pad if quote is approved
      setShowSignature(quote.status === "APPROVED");
    }
  }, [quote, form]);

  const handleCategoryChange = (checkedValue: string, checked: boolean) => {
    let newSelectedCategories: string[];

    if (checkedValue === "all") {
      // If selecting 'all', clear other selections
      // If deselecting 'all', leave empty to allow selecting individual categories
      newSelectedCategories = checked ? ["all"] : [];
    } else {
      if (checked) {
        // If selecting an individual category
        newSelectedCategories = selectedCategories.includes("all")
          ? [checkedValue] // If 'all' was selected, switch to just this category
          : [...selectedCategories, checkedValue]; // Add to existing selections
      } else {
        // If deselecting an individual category
        newSelectedCategories = selectedCategories.filter(
          (cat) => cat !== checkedValue,
        );
      }
    }

    // If no categories are selected, default to 'all'
    if (newSelectedCategories.length === 0) {
      newSelectedCategories = ["all"];
    }

    setSelectedCategories(newSelectedCategories);

    // Clear selected products when changing categories
    setSelectedProducts([]);
    form.setFieldsValue({
      subtotal: "0",
      taxAmount: "0",
      total: "0",
    });
  };

  const updateTotals = (products: SelectedProduct[]) => {
    const subtotal = products.reduce(
      (acc, curr) => acc + curr.quantity * curr.price,
      0,
    );
    const taxPercentage = form.getFieldValue("taxPercentage") || 0;
    const taxAmount = (subtotal * taxPercentage) / 100;
    const advancePayment = form.getFieldValue("advancePayment") || 0;
    const total = subtotal + taxAmount - advancePayment;

    form.setFieldsValue({
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    });
  };

  const handleTaxPercentageChange = (value: number | null) => {
    if (value === null) return;
    updateTotals(selectedProducts);
  };

  const handleAdvancePaymentChange = (value: number | null) => {
    if (value === null) return;
    updateTotals(selectedProducts);
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const newProducts = [...selectedProducts];
      newProducts[index] = {
        id: product.id,
        quantity: 1,
        price: Number(product.price),
        name: product.name,
      };
      setSelectedProducts(newProducts);
      updateTotals(newProducts);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].quantity = quantity;
    setSelectedProducts(newProducts);
    updateTotals(newProducts);
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);

      let digitalSignature = null;
      let signedAt = null;

      if (values.status === "APPROVED") {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
          message.error("Please provide a digital signature");
          return;
        }
        digitalSignature = signatureRef.current.toDataURL();
        signedAt = new Date().toISOString();
      }

      const items = selectedProducts.map((product) => {
        const productData = products.find((p) => p.id === product.id);
        return {
          productId: product.id,
          productName: productData?.name || "",
          quantity: product.quantity,
          unitPrice: product.price.toString(),
          subtotal: (product.quantity * product.price).toString(),
        };
      });

      // Format category names for the quote
      const categoryNames = selectedCategories.includes("all")
        ? "All Categories"
        : selectedCategories.join(", ");

      const quoteData = {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        templateName: values.templateName || "",
        categoryName: categoryNames, // Use formatted category names
        status: values.status,
        subtotal: values.subtotal.toString(),
        taxPercentage: values.taxPercentage
          ? values.taxPercentage.toString()
          : "0",
        taxAmount: values.taxAmount.toString(),
        total: values.total.toString(),
        advancePayment: values.advancePayment
          ? values.advancePayment.toString()
          : "0",
        digitalSignature,
        signedAt,
        items,
      };

      if (quote) {
        await quoteService.updateQuote(quote.id, quoteData);
        message.success("Quote updated successfully");
      } else {
        await quoteService.createQuote(quoteData);
        message.success("Quote created successfully");
      }

      form.resetFields();
      setSelectedProducts([]);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
      onSuccess();
    } catch (error) {
      console.error("Error creating quote:", error);
      message.error("Failed to create quote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setShowSignature(status === "APPROVED");
  };

  const handleSchedule = () => {
    const calendarUrl = generateGoogleCalendarUrl({
      customerName: form.getFieldValue('customerName'),
      total: Number(form.getFieldValue('total')) || 0,
      id: quote?.id || 0,
    });
    window.open(calendarUrl, '_blank');
  };

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { id: 0, quantity: 1, price: 0 },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
    updateTotals(newProducts);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: "DRAFT",
          taxPercentage: 0,
          advancePayment: 0,
        }}
      >
        <Form.Item
          name="customerName"
          label="Customer Name"
          rules={[{ required: true, message: "Please input customer name!" }]}
        >
          <Input placeholder="Enter customer name" />
        </Form.Item>

        <Form.Item
          name="customerEmail"
          label="Customer Email"
          rules={[
            { required: true, message: "Please input customer email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter customer email" />
        </Form.Item>

        <Form.Item label="Categories">
          <Space>
            <Checkbox
              checked={selectedCategories.includes("all")}
              onChange={(e) => handleCategoryChange("all", e.target.checked)}
            >
              All Categories
            </Checkbox>
            {categories.map((category) => (
              <Checkbox
                key={category.id}
                checked={selectedCategories.includes(category.name)}
                onChange={(e) =>
                  handleCategoryChange(category.name, e.target.checked)
                }
              >
                {category.name}
              </Checkbox>
            ))}
          </Space>
        </Form.Item>
        <Form.Item name="templateName" label="Quote Template">
          <Select placeholder="Select a template">
            {templates.map((template) => (
              <Option key={template.id} value={template.name}>
                {template.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Products">
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {selectedProducts.map((product, index) => (
              <Card key={index} size="small">
                <Space>
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select product"
                    value={product.id || undefined}
                    onChange={(value) => handleProductSelect(index, value)}
                  >
                    {filteredProducts.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name} - ${Number(p.price).toFixed(2)} per {p.unit}
                      </Option>
                    ))}
                  </Select>

                  <InputNumber
                    min={1}
                    value={product.quantity}
                    onChange={(value) =>
                      handleQuantityChange(index, value || 1)
                    }
                  />
                  <span>${(product.quantity * product.price).toFixed(2)}</span>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveProduct(index)}
                  />
                </Space>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={handleAddProduct}
              icon={<PlusOutlined />}
              style={{ width: "100%" }}
            >
              Add Product
            </Button>
          </Space>
        </Form.Item>

        <Form.Item name="taxPercentage" label="Tax Percentage">
          <InputNumber
            min={0}
            max={100}
            precision={2}
            style={{ width: "100%" }}
            onChange={handleTaxPercentageChange}
          />
        </Form.Item>

        <Form.Item name="advancePayment" label="Advance Payment">
          <InputNumber
            min={0}
            precision={2}
            style={{ width: "100%" }}
            onChange={handleAdvancePaymentChange}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Please select a status" }]}
        >
          <Select onChange={handleStatusChange}>
            <Option value="DRAFT">Draft</Option>
            <Option value="APPROVED">Approved</Option>
          </Select>
        </Form.Item>

        {showSignature && (
          <Form.Item
            label="Digital Signature"
            required
            help="Please sign in the box below"
          >
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "2px",
                background: "#fff",
              }}
            >
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "signature-canvas",
                }}
              />
            </div>
            <Button
              type="text"
              onClick={() => signatureRef.current?.clear()}
              style={{ marginTop: "8px" }}
            >
              Clear Signature
            </Button>
          </Form.Item>
        )}

        <Form.Item name="subtotal" label="Subtotal">
          <InputNumber disabled style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="taxAmount" label="Tax Amount">
          <InputNumber disabled style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="total" label="Total">
          <InputNumber disabled style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {quote ? "Update Quote" : "Create Quote"}
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={handleSchedule}
              disabled={form.getFieldValue('status') !== 'APPROVED'}
            >
              Schedule Quote
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}