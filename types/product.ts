export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    size?: string;
    stock_quantity: number;
    images: string[];
    created_at: string;
  }
  
  export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    category: string;
    size?: string;
    stock_quantity: number;
    images: string[];
  }