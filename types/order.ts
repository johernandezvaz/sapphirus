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

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  order_items: OrderItem[];
}