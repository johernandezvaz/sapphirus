/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  order_items: OrderItem[];
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Package,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors = {
  pending: "text-yellow-500",
  processing: "text-blue-500",
  shipped: "text-purple-500",
  delivered: "text-green-500",
  cancelled: "text-red-500",
};

const statusLabels = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function OrdersPage() {
  useEffect(() => {
    document.title = 'Sapphirus - Mis Pedidos';
  }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              images
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="min-h-screen bg-muted/50 pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-6" />
                <h2 className="text-2xl font-semibold mb-4">¡Aún no tienes pedidos!</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Explora nuestro catálogo de productos y encuentra algo especial para ti.
                </p>
                <Button asChild size="lg">
                  <a href="/products">
                    Explorar Catálogo
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 pt-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-bold">Mis Pedidos</h1>
            <p className="text-muted-foreground mt-2">
              Historial de todos tus pedidos
            </p>
          </div>

          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">
                        Pedido #{order.id.slice(0, 8)}
                      </CardTitle>
                      <div className={`flex items-center gap-2 ${statusColors[order.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {statusLabels[order.status]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 py-2 border-b last:border-0"
                          >
                            <div className="h-16 w-16 relative rounded overflow-hidden">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {item.quantity} × ${item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ${(item.quantity * item.unit_price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-lg font-semibold">
                            Total: ${order.total_amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}