import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import RegisterModal from './RegisterModal';
import { userService } from '@/services/users';
import { queryClient } from '@/lib/queryClient';

interface LoginModalProps {
  open: boolean;
  onSuccess: () => void;
}

export default function LoginModal({ open, onSuccess }: LoginModalProps) {
  const [form] = Form.useForm();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: { email: string; password: string; companyName: string }) => {
    try {
      // Clear all existing caches before login
      userService.clearCache();
      queryClient.clear();

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const user = await response.json();
      message.success(`Welcome ${user.firstName}!`);
      onSuccess();
    } catch (error) {
      message.error('Login failed. Please check your credentials and company name.');
    }
  };

  return (
    <>
      <Modal
        title={<div className="text-2xl font-bold text-center">QuoteSystem</div>}
        open={open && !showRegister}
        footer={null}
        closable={false}
        maskClosable={false}
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
            rules={[{ required: true, message: 'Please input your company name!' }]}
          >
            <Input placeholder="Enter company name" />
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

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>

          <div className="text-center">
            <Button type="link" onClick={() => setShowRegister(true)}>
              Create new account
            </Button>
          </div>
        </Form>
      </Modal>

      <RegisterModal
        open={open && showRegister}
        onSuccess={onSuccess}
        onCancel={() => setShowRegister(false)}
      />
    </>
  );
}