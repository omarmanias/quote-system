import { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Upload, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from 'antd/es/upload/interface';
import type { Company } from "@shared/schema";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company/settings');
      if (response.status === 401) {
        message.error('Please log in to access company settings');
        navigate('/');
        return;
      }
      if (response.status === 403) {
        setError('You do not have access to company settings');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load company settings');
      }

      const data = await response.json();
      setCompany(data);
      form.setFieldsValue(data);
      if (data.logoUrl) {
        setFileList([
          {
            uid: '-1',
            name: 'Company Logo',
            status: 'done',
            url: data.logoUrl,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
      message.error('Failed to load company settings');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Validate mandatory fields
      if (!values.name) {
        message.error('Company name is required');
        return;
      }

      if (!values.logo?.fileList?.length && !company?.logoUrl) {
        message.error('Company logo is required');
        return;
      }

      setIsLoading(true);
      const formData = new FormData();

      formData.append('name', values.name);

      if (values.logo?.fileList?.[0]?.originFileObj) {
        formData.append('logo', values.logo.fileList[0].originFileObj);
      }

      const response = await fetch('/api/company/settings', {
        method: 'PUT',
        body: formData,
      });

      if (response.status === 401) {
        message.error('Please log in to update company settings');
        navigate('/');
        return;
      }

      if (response.status === 403) {
        message.error('You do not have permission to update company settings');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update company settings');
      }

      message.success('Company settings updated successfully');
      fetchCompanySettings();
      window.location.reload(); // Refresh to update company name in title and menu
    } catch (error) {
      console.error('Error updating company settings:', error);
      message.error('Failed to update company settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          message="Access Denied"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Company Settings">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={company || {}}
        >
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="logo"
            label="Company Logo"
            rules={[
              { 
                required: !company?.logoUrl, 
                message: 'Please upload a company logo' 
              }
            ]}
          >
            <Upload
              accept="image/*"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Upload Logo</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}