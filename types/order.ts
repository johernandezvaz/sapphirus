import { OrderStatus } from './enums';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    image_url: string[];
  };
}

export interface OrderUser {
  id: string;
  email: string;
  full_name: string;
}

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  user_id: string;
  user?: OrderUser;
  order_items: OrderItem[];
}

export interface OrderWithUser extends Omit<Order, 'user'> {
  user: OrderUser | null;
}