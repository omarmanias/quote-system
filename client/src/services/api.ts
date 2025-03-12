// Base API URL
const API_BASE_URL = '';

// Common headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Base fetch function with common configuration
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}
