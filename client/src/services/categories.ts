import { apiClient } from './api';
import type { Category, InsertCategory } from '@shared/schema';

export const categoryService = {
  // Get all categories
  getCategories: () => {
    return apiClient<Category[]>('/api/categories');
  },

  // Get single category
  getCategory: (id: number) => {
    return apiClient<Category>(`/api/categories/${id}`);
  },

  // Get category children
  getCategoryChildren: (id: number) => {
    return apiClient<Category[]>(`/api/categories/${id}/children`);
  },

  // Create a new category
  createCategory: (categoryData: InsertCategory) => {
    return apiClient<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Update a category
  updateCategory: (id: number, categoryData: Partial<InsertCategory>) => {
    return apiClient<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    });
  },

  // Delete a category
  deleteCategory: (id: number) => {
    return apiClient(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};