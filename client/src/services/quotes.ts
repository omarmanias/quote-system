import { apiClient } from './api';
import type { Quote, InsertQuote, Customer } from '@shared/schema';

export const quoteService = {
  // Get all quotes
  getQuotes: () => {
    return apiClient<Quote[]>('/api/quotes');
  },

  // Get single quote
  getQuote: (id: number) => {
    return apiClient<Quote>(`/api/quotes/${id}`);
  },

  // Create a new quote
  createQuote: (quoteData: InsertQuote) => {
    return apiClient<Quote>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  // Update a quote
  updateQuote: (id: number, quoteData: Partial<InsertQuote>) => {
    return apiClient<Quote>(`/api/quotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(quoteData),
    });
  },

  // Delete a quote
  deleteQuote: (id: number) => {
    return apiClient(`/api/quotes/${id}`, {
      method: 'DELETE',
    });
  },

  // Create a new customer
  createCustomer: (customerData: Customer) => {
    return apiClient<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  // Get customer by ID
  getCustomer: (id: number) => {
    return apiClient<Customer>(`/api/customers/${id}`);
  },
};