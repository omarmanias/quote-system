import { useState, useEffect } from "react";
import { Form, Input, Button, Card, List, Typography, Modal, message, Popconfirm, Space, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { insertCategorySchema, insertQuoteTemplateSchema } from "@shared/schema";
import type { Category, QuoteTemplate } from "@shared/schema";
import { categoryService } from "@/services/categories";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SubcategoryFormItem {
  name: string;
  description?: string;
  id?: number; 
  isNew?: boolean;
}

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, templatesData] = await Promise.all([
        categoryService.getCategories(),
        fetch('/api/quote-templates').then(res => res.json()),
      ]);
      setCategories(categoriesData);
      setTemplates(templatesData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const validatedData = insertCategorySchema.parse(values);

      let mainCategory: Category;
      if (editingCategory) {
        mainCategory = await categoryService.updateCategory(editingCategory.id, validatedData);
        message.success('Category updated successfully');
      } else {
        mainCategory = await categoryService.createCategory(validatedData);
        message.success('Category created successfully');

        // Create subcategories
        for (const subcategory of subcategories) {
          await categoryService.createCategory({
            name: subcategory.name,
            description: subcategory.description,
            parentId: mainCategory.id,
          });
        }
      }

      // Fetch updated data
      await fetchData();

      setIsModalOpen(false);
      setEditingCategory(null);
      setSubcategories([]);
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const validatedData = insertQuoteTemplateSchema.parse({
        ...values,
        categoryId: selectedCategory?.id,
      });

      await fetch('/api/quote-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      message.success('Template created successfully');
      await fetchData();
      setIsTemplateModalOpen(false);
      templateForm.resetFields();
    } catch (error) {
      message.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      message.success('Category deleted successfully');
      // Update local state immediately
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
    }
  };

  const handleAddSubcategory = (values: SubcategoryFormItem) => {
    setSubcategories([...subcategories, { ...values, isNew: true }]);
    subcategoryForm.resetFields();
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    form.resetFields();
    setSubcategories([]);
    setIsModalOpen(true);
  };

  const handleAddTemplate = (category: Category) => {
    setSelectedCategory(category);
    templateForm.resetFields();
    setIsTemplateModalOpen(true);
  };

  const renderCategoryHierarchy = (category: Category) => {
    const parent = categories.find(c => c.id === category.parentId);
    return parent ? `${parent.name} > ${category.name}` : category.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Categories</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
        >
          Add Category
        </Button>
      </div>

      <Modal
        title={editingCategory ? "Edit Category" : "Add New Category"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setSubcategories([]);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please input category name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={4} />
          </Form.Item>

          {!editingCategory && (
            <>
              <Title level={4}>Add Subcategories</Title>
              <Form
                form={subcategoryForm}
                layout="vertical"
                onFinish={handleAddSubcategory}
              >
                <div className="flex gap-4 mb-4">
                  <Form.Item
                    label="Name"
                    name="name"
                    className="flex-1"
                    rules={[{ required: true, message: "Please input subcategory name!" }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label="Description"
                    name="description"
                    className="flex-1"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item label=" " className="flex items-end">
                    <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
                      Add
                    </Button>
                  </Form.Item>
                </div>
              </Form>

              {subcategories.length > 0 && (
                <List
                  className="mb-4"
                  size="small"
                  bordered
                  dataSource={subcategories}
                  renderItem={(subcategory, index) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveSubcategory(index)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={subcategory.name}
                        description={subcategory.description}
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}

          <Form.Item className="flex justify-end gap-2 mb-0">
            <Button onClick={() => {
              setIsModalOpen(false);
              setEditingCategory(null);
              setSubcategories([]);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Template"
        open={isTemplateModalOpen}
        onCancel={() => {
          setIsTemplateModalOpen(false);
          setSelectedCategory(null);
          templateForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleTemplateSubmit}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please input template name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: "Please input template content!" }]}
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item className="flex justify-end gap-2 mb-0">
            <Button onClick={() => {
              setIsTemplateModalOpen(false);
              setSelectedCategory(null);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Create Template
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card>
        <List
          loading={isLoading}
          dataSource={categories}
          locale={{ emptyText: "No categories found" }}
          renderItem={(category) => {
            const categoryTemplates = templates.filter(t => t.categoryId === category.id);
            const childCategories = categories.filter(c => c.parentId === category.id);

            return (
              <List.Item
                actions={[
                  <Button
                    key="template"
                    icon={<FileTextOutlined />}
                    onClick={() => handleAddTemplate(category)}
                  >
                    Add Template
                  </Button>,
                  <Button
                    key="edit"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete category"
                    description="Are you sure you want to delete this category?"
                    onConfirm={() => handleDelete(category.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={renderCategoryHierarchy(category)}
                  description={
                    <>
                      <div>{category.description}</div>
                      {childCategories.length > 0 && (
                        <div className="mt-2">
                          <strong>Subcategories:</strong>
                          <ul className="list-disc pl-5">
                            {childCategories.map(child => (
                              <li key={child.id}>{child.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {categoryTemplates.length > 0 && (
                        <div className="mt-2">
                          <strong>Templates:</strong>
                          <ul className="list-disc pl-5">
                            {categoryTemplates.map(template => (
                              <li key={template.id}>{template.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}