import { useEffect } from 'react';
import { Modal, Form, Input, Button, Select, message } from 'antd';

const { Option } = Select;

interface RegisterModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RegisterModal({ open, onSuccess, onCancel }: RegisterModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const user = await response.json();
      message.success('Registration successful!');
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Registration failed');
    }
  };

  return (
    <Modal
      title={<div className="text-xl font-bold text-center">Create New Account</div>}
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: 'Please input company name!' }]}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>

        <Form.Item
          label="First Name"
          name="firstName"
          rules={[{ required: true, message: 'Please input your first name!' }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[{ required: true, message: 'Please input your last name!' }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role!' }]}
        >
          <Select placeholder="Select role">
            <Option value="ADMIN">Admin</Option>
            <Option value="USER">User</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Register
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}