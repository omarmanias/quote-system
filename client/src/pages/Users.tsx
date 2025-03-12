import { useState } from "react";
import { Form, Input, Button, Card, List, Typography, Modal, message, Space, Popconfirm, Select, Alert } from "antd";
import { UserAddOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { insertUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/users";

const { Title } = Typography;
const { Option } = Select;

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get current user to access company ID
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch current user');
      return response.json();
    }
  });

  // Use React Query for fetching users with company ID in the query key
  const { 
    data: users = [], 
    isLoading,
    error: queryError,
    refetch 
  } = useQuery({ 
    queryKey: ['users', currentUser?.companyId],
    queryFn: userService.getUsers,
    enabled: !!currentUser?.companyId, // Only fetch when we have the company ID
    staleTime: 0, // Always refetch on mount
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.companyId] });
      message.success('User created successfully');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to create user');
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.companyId] });
      message.success('User updated successfully');
      setIsModalOpen(false);
      setEditingUser(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to update user');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', currentUser?.companyId] });
      message.success('User deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete user');
    }
  });

  const handleSubmit = async (values: any) => {
    try {
      const validatedData = insertUserSchema.parse({
        ...values,
        companyId: currentUser?.companyId
      });

      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: validatedData
        });
      } else {
        await createUserMutation.mutateAsync(validatedData);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by mutation error callback
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  if (queryError) {
    const error = queryError as Error;
    if (error.message.includes('401')) {
      message.error('Please log in to view users');
      navigate('/');
      return null;
    }
    if (error.message.includes('403')) {
      return (
        <Alert
          message="Access Denied"
          description="You do not have access to view users"
          type="error"
          showIcon
        />
      );
    }
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Users</Title>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleAddNew}
        >
          Add User
        </Button>
      </div>

      <Modal
        title={editingUser ? "Edit User" : "Add New User"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: "Please input first name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: "Please input last name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input email!" },
              { type: 'email', message: "Please enter a valid email!" }
            ]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please input password!" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role!" }]}
          >
            <Select>
              <Option value="ADMIN">Administrator</Option>
              <Option value="USER">User</Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end gap-2 mb-0">
            <Button onClick={() => {
              setIsModalOpen(false);
              setEditingUser(null);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card>
        <List
          loading={isLoading}
          dataSource={users}
          locale={{ emptyText: "No users found" }}
          renderItem={(user) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </Button>,
                <Popconfirm
                  key="delete"
                  title="Delete user"
                  description="Are you sure you want to delete this user?"
                  onConfirm={() => handleDelete(user.id)}
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
                title={`${user.firstName} ${user.lastName}`}
                description={
                  <>
                    <div>Email: {user.email}</div>
                    <div>Role: {user.role}</div>
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