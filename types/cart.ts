export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }
  
  export interface Cart {
    items: CartItem[];
    total: number;
  }