import { useState, useEffect } from "react";
import { Button, Card, List, Typography, Modal, message } from "antd";
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Quote, Customer, Category, Product, QuoteTemplate, Company } from "@shared/schema";
import { quoteService } from "@/services/quotes";
import { categoryService } from "@/services/categories";
import QuoteForm from "./QuoteForm";
import { generateQuotePDF } from "./QuotePDF";

const { Title } = Typography;

export default function Quotes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesData, categoriesData, productsData, templatesData, companyData] = await Promise.all([
        quoteService.getQuotes(),
        categoryService.getCategories(),
        fetch('/api/products').then(res => res.json()),
        fetch('/api/quote-templates').then(res => res.json()),
        fetch('/api/company/settings').then(res => res.json()),
      ]);

      setQuotes(quotesData);
      setCategories(categoriesData);
      setProducts(productsData);
      setTemplates(templatesData);
      setCompany(companyData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingQuote(null);
    fetchData();
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const category = quote.categoryName === 'All Categories' 
        ? { name: 'All Categories', description: 'All available categories' }
        : { name: quote.categoryName || '', description: '' };

      // Find the template content if it exists
      const template = templates.find(t => t.name === quote.templateName);
      const templateContent = template ? template.content : '';

      const blob = await generateQuotePDF({
        quote,
        items: quote.items,
        products,
        category,
        templateContent,
        company: company!
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleDelete = async (quote: Quote) => {
    try {
      await quoteService.deleteQuote(quote.id);
      message.success('Quote deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete quote');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quotes</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingQuote(null);
            setIsModalOpen(true);
          }}
        >
          Create Quote
        </Button>
      </div>

      <Modal
        title={editingQuote ? "Edit Quote" : "Create New Quote"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingQuote(null);
        }}
        footer={null}
        width={800}
      >
        <QuoteForm
          quote={editingQuote}
          categories={categories}
          products={products}
          templates={templates}
          onSuccess={handleSuccess}
        />
      </Modal>

      <Card>
        <List
          loading={isLoading}
          dataSource={quotes}
          locale={{ emptyText: "No quotes found" }}
          renderItem={(quote) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(quote)}
                >
                  Edit
                </Button>,
                <Button
                  key="download"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadPDF(quote)}
                >
                  Download PDF
                </Button>,
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => Modal.confirm({
                    title: 'Delete Quote',
                    content: 'Are you sure you want to delete this quote?',
                    okText: 'Yes',
                    cancelText: 'No',
                    onOk: () => handleDelete(quote),
                  })}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                title={`Quote #${quote.id} - ${quote.customerName}`}
                description={
                  <>
                    <div>Category: {quote.categoryName}</div>
                    <div>Status: {quote.status}</div>
                    <div>Total: ${Number(quote.total).toFixed(2)}</div>
                    {quote.status === 'APPROVED' && quote.signedAt && (
                      <div>Signed at: {new Date(quote.signedAt).toLocaleString()}</div>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}