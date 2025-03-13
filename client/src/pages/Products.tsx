import { useState, useEffect } from "react";
import { Form, Input, Button, Card, List, Typography, Modal, InputNumber, message, Space, Popconfirm, Select, Upload, Image } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { insertProductSchema } from "@shared/schema";
import type { Product, Category, Image as ProductImage } from "@shared/schema";
import { productService } from "@/services/products";
import { categoryService } from "@/services/categories";
import type { UploadFile } from 'antd/es/upload/interface';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface VariationFormItem {
  name: string;
  price: number;
}

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<VariationFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [variationForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Add all non-file fields to formData
      Object.keys(values).forEach(key => {
        if (key !== 'imageFiles' && values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key].toString());
        }
      });

      // Preserve existing images when updating
      if (editingProduct?.imageUrls) {
        formData.append('imageUrls', JSON.stringify(editingProduct.imageUrls));
      }

      // Handle new image files from upload component
      if (fileList && fileList.length > 0) {
        fileList.forEach((file: UploadFile) => {
          if (file.originFileObj) {
            formData.append('images', file.originFileObj);
          }
        });
      }

      let product;
      if (editingProduct) {
        product = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: formData
        }).then(res => {
          if (!res.ok) throw new Error('Failed to update product');
          return res.json();
        });
        message.success('Product updated successfully');
      } else {
        product = await fetch('/api/products', {
          method: 'POST',
          body: formData
        }).then(res => {
          if (!res.ok) throw new Error('Failed to create product');
          return res.json();
        });
        message.success('Product created successfully');
      }

      await fetchData();
      setIsModalOpen(false);
      setEditingProduct(null);
      setFileList([]);
      form.resetFields();
    } catch (error) {
      console.error('Error saving product:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    variationForm.validateFields().then(handleAddVariation);
  };

  const handleAddVariation = (values: VariationFormItem) => {
    setVariations([...variations, values]);
    variationForm.resetFields();
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const categoryId = categories.find(c => c.name === product.categoryName)?.id;

    // Set initial file list from existing image URLs
    const initialFileList = (product.imageUrls || []).map((url, index) => ({
      uid: `-${index}`,
      name: `Image ${index + 1}`,
      status: 'done',
      url: url,
    }));
    setFileList(initialFileList);

    form.setFieldsValue({
      ...product,
      categoryId,
      price: Number(product.price),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      message.success('Product deleted successfully');
      await fetchData();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setVariations([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleUpload = ({ file, onSuccess }: any) => {
    try {
      if (!file) {
        message.error('No file selected');
        return;
      }

      // Create a new FileList with the current files
      const newFileList = [...fileList];
      newFileList.push({
        uid: file.uid,
        name: file.name,
        status: 'done',
        originFileObj: file,
        url: URL.createObjectURL(file)
      });

      setFileList(newFileList);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      message.error('Failed to process image upload');
    }
  };

  const handleRemoveImage = async (imageIndex: number) => {
    try {
      if (!editingProduct) return;

      const updatedImageUrls = editingProduct.imageUrls.filter((_, index) => index !== imageIndex);
      setEditingProduct({ ...editingProduct, imageUrls: updatedImageUrls });

      const updatedFileList = fileList.filter((_, index) => index !== imageIndex);
      setFileList(updatedFileList);

      message.success('Image removed successfully');
    } catch (error) {
      message.error('Failed to remove image');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Products</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
        >
          Add Product
        </Button>
      </div>

      <Modal
        title={editingProduct ? "Edit Product" : "Add New Product"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          setVariations([]);
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
            rules={[{ required: true, message: "Please input product name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Category"
            name="categoryId"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select placeholder="Select a category">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Unit"
            name="unit"
            rules={[{ required: true, message: "Please input product unit!" }]}
          >
            <Input placeholder="e.g., piece, kg, meter" />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please input product price!" }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Product Images"
            name="imageFiles"
          >
            <div className="space-y-4">
              <div className="">
                <Upload
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  multiple
                  accept="image/*"
                  customRequest={handleUpload}
                  onRemove={(file) => {
                    const index = fileList.indexOf(file);
                    handleRemoveImage(index);
                    return true;
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                  </Button>
                </Upload>
              </div>
            </div>
          </Form.Item>

          {!editingProduct && (
            <>
              <Title level={4}>Add Variations</Title>
              <Form
                form={variationForm}
                layout="vertical"
                onSubmit={handleVariationSubmit}
                className="mb-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: "Please input variation name!" }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label="Price"
                    name="price"
                    rules={[{ required: true, message: "Please input price!" }]}
                  >
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Button
                  type="dashed"
                  onClick={handleVariationSubmit}
                  icon={<PlusOutlined />}
                  block
                >
                  Add Variation
                </Button>
              </Form>

              {variations.length > 0 && (
                <List
                  className="mt-4"
                  size="small"
                  bordered
                  dataSource={variations}
                  renderItem={(variation, index) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveVariation(index)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={variation.name}
                        description={
                          <div>Price: ${variation.price}</div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}

          <Form.Item className="flex justify-end gap-2 mb-0 mt-4">
            <Button onClick={() => {
              setIsModalOpen(false);
              setEditingProduct(null);
              setVariations([]);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card>
        <List
          loading={isLoading}
          dataSource={products}
          locale={{ emptyText: "No products found" }}
          renderItem={(product) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </Button>,
                <Popconfirm
                  key="delete"
                  title="Delete product"
                  description="Are you sure you want to delete this product?"
                  onConfirm={() => handleDelete(product.id)}
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
                title={product.name}
                description={
                  <>
                    <div>{product.description}</div>
                    <div>Category: {product.categoryName}</div>
                    <div>Unit: {product.unit}</div>
                    <div>Base Price: ${Number(product.price).toFixed(2)}</div>
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