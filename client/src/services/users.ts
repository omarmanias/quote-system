import { apiClient } from './api';
import type { User, InsertUser } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

export const userService = {
  // Get company-specific users
  getUsers: async () => {
    const response = await apiClient<User[]>('/api/users');
    return response;
  },

  // Create a new user
  createUser: async (userData: InsertUser) => {
    const response = await apiClient<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  },

  // Update user
  updateUser: async (id: number, userData: Partial<InsertUser>) => {
    const response = await apiClient<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    return response;
  },

  // Delete user
  deleteUser: async (id: number) => {
    await apiClient(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Clear all user-related cache
  clearCache: () => {
    // Remove all user queries, regardless of company ID
    queryClient.removeQueries({ queryKey: ['users'] });
    // Also remove the current user query
    queryClient.removeQueries({ queryKey: ['/api/user'] });
  }
};