
import { User, Product, Order, CustomOrder, UserRole, OrderStatus, AuthResponse } from '../types';

// Use relative path '/api' by default. 
// In Development: vite.config.ts proxies this to http://localhost:3001
// In Production: vercel.json rewrites this to the server function
const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  // Construct full URL.
  // If API_URL is relative (/api), valid for proxy/same-origin.
  // If API_URL is absolute, uses that.
  const fullUrl = `${API_URL}${endpoint}`;

  try {
    const session = getCurrentSession();
    const headers: any = { 'Content-Type': 'application/json' };
    
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    const config: any = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    const response = await fetch(fullUrl, config);
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}`);
      }
      return data;
    } else {
      const text = await response.text();
      // Include fullUrl in error message for clarity
      throw new Error(`Non-JSON Error (${response.status}) at ${fullUrl}: ${text.substring(0, 100)}`);
    }

  } catch (error: any) {
    console.error(`Fetch Failure [${method} ${fullUrl}]:`, error.message);
    throw error;
  }
};

// Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const data = await apiRequest('/login', 'POST', { email, password });
  localStorage.setItem('vkm_session', JSON.stringify(data));
  return data;
};

export const register = async (userData: any): Promise<AuthResponse> => {
  const data = await apiRequest('/register', 'POST', userData);
  localStorage.setItem('vkm_session', JSON.stringify(data));
  return data;
};

export const logout = () => { localStorage.removeItem('vkm_session'); };
export const getCurrentSession = (): AuthResponse | null => {
  const session = localStorage.getItem('vkm_session');
  try {
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
};

// Admin Contact
export const getAdminContact = async (): Promise<string> => {
  try {
    const data = await apiRequest('/settings/contact');
    return data.phone || '9999999999';
  } catch { return '9999999999'; }
};

export const updateAdminContact = async (phone: string): Promise<void> => {
  await apiRequest('/settings/contact', 'PUT', { phone });
};

// Users
export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    return await apiRequest(`/users/${id}`);
  } catch { return undefined; }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    return await apiRequest('/products');
  } catch { return []; }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  return await apiRequest('/products', 'POST', product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await apiRequest(`/products/${id}`, 'DELETE');
};

// Orders
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    return await apiRequest('/orders');
  } catch { return []; }
};

export const placeOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'totalPrice' | 'productTitle' | 'productImage' | 'expectedDeliveryAt'>): Promise<Order> => {
  return await apiRequest('/orders', 'POST', orderData);
};

export const updateOrderStatus = async (type: 'normal' | 'custom', id: string, status: OrderStatus): Promise<void> => {
  const endpoint = type === 'normal' ? `/orders/${id}/status` : `/custom-orders/${id}/status`;
  await apiRequest(endpoint, 'PUT', { status });
};

export const deleteOrder = async (id: string): Promise<void> => {
  await apiRequest(`/orders/${id}`, 'DELETE');
};

// Custom Orders
export const getAllCustomOrders = async (): Promise<CustomOrder[]> => {
  try {
    return await apiRequest('/custom-orders');
  } catch { return []; }
};

export const placeCustomOrder = async (orderData: Omit<CustomOrder, 'id' | 'createdAt' | 'status' | 'deadlineAt'>): Promise<CustomOrder> => {
  return await apiRequest('/custom-orders', 'POST', orderData);
};

export const deleteCustomOrder = async (id: string): Promise<void> => {
  await apiRequest(`/custom-orders/${id}`, 'DELETE');
};

// User Specific Getters
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const all = await getAllOrders();
  return all.filter(o => o.userId === userId);
};

export const getUserCustomOrders = async (userId: string): Promise<CustomOrder[]> => {
  const all = await getAllCustomOrders();
  return all.filter(o => o.userId === userId);
};
