import { apiClient } from './api';
import type { Product, InsertProduct, ProductVariant, InsertProductVariant } from '@shared/schema';

export const productService = {
  // Get all products
  getProducts: () => {
    return apiClient<Product[]>('/api/products');
  },

  // Get single product
  getProduct: (id: number) => {
    return apiClient<Product>(`/api/products/${id}`);
  },

  // Create a new product
  createProduct: (productData: InsertProduct) => {
    return apiClient<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update a product
  updateProduct: (id: number, productData: Partial<InsertProduct>) => {
    return apiClient<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    });
  },

  // Delete a product
  deleteProduct: (id: number) => {
    return apiClient(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Delete product image
  deleteProductImage: (productId: number, imageId: number) => {
    return apiClient(`/api/products/${productId}/images/${imageId}`, {
      method: 'DELETE'
    });
  },

  // Get product variants
  getProductVariants: (productId: number) => {
    return apiClient<ProductVariant[]>(`/api/products/${productId}/variants`);
  },

  // Create product variant
  createProductVariant: (productId: number, variantData: Omit<InsertProductVariant, 'productId'>) => {
    return apiClient<ProductVariant>(`/api/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify({ ...variantData, productId }),
    });
  },

  // Update product variant
  updateProductVariant: (productId: number, variantId: number, variantData: Partial<InsertProductVariant>) => {
    return apiClient<ProductVariant>(`/api/products/${productId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(variantData),
    });
  },

  // Delete product variant
  deleteProductVariant: (productId: number, variantId: number) => {
    return apiClient(`/api/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  },
};