
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string; // Must be "Kanchipuram"
  area: string;
  role: UserRole;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  durationHours: number;
  images: string[];
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  billId?: string; // Daily Bill ID (e.g., VKM-20231010-001)
  userId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  totalPrice: number;
  description?: string;
  status: OrderStatus;
  createdAt: string;
  expectedDeliveryAt: string;
}

export interface CustomOrder {
  id: string;
  userId: string;
  description: string;
  requestedDate: string;
  requestedTime: string;
  contactName: string;
  contactPhone: string;
  images: string[];
  status: OrderStatus;
  createdAt: string;
  deadlineAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
