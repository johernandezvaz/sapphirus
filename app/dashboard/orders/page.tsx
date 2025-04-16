/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatus, statusColors, statusLabels } from '@/types/enums';
import { Order, OrderWithUser } from '@/types/order';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from '@/components/ui/input';
import { Search, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

// Define status icons using Lucide components
const StatusIconComponents = {
  pending: Clock,
  processing: Package,
  shipped: Package,
  delivered: CheckCircle,
  cancelled: XCircle,
} as const;

export default function OrdersManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  useEffect(() => {
    requireAuth('admin');
    document.title = 'Sapphirus - Gestión de Pedidos';
  }, []);

  // Fetch all orders with user details
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          ),
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

        console.log((await query).data);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.textSearch('profiles.full_name', searchQuery);
      }

      const { data: orders, error: ordersError } = await query;
      if (ordersError) throw ordersError;

      console.log('Raw orders data:', orders);

      // Transform the data to match our types
      return orders?.map(order => ({
        id: order.id,
        created_at: order.created_at,
        status: order.status as OrderStatus,
        total_amount: order.total_amount,
        user_id: order.user_id,
        user: order.profiles ? {
          id: order.profiles.id,
          email: order.profiles.email,
          full_name: order.profiles.full_name
        } : null,
        order_items: (order.order_items || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          product: {
            name: item.products?.name || 'Producto no disponible',
            image_url: parseImageUrls(item.products?.image_url)
          }
        }))
      })) as OrderWithUser[];
    }
  });

  // Helper function to parse image URLs
  const parseImageUrls = (imageUrl: string | string[] | undefined): string[] => {
    if (!imageUrl) return [];
    
    if (typeof imageUrl === 'string') {
      try {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed : [imageUrl];
      } catch {
        return [imageUrl];
      }
    }
    
    return Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  };

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    }
  });

  // Helper function to get the first valid image URL
  const getFirstImageUrl = (imageUrl: string[]): string => {
    return imageUrl[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
            <p className="text-muted-foreground">
              Administra y actualiza el estado de los pedidos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | OrderStatus)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="processing">En proceso</SelectItem>
                <SelectItem value="shipped">Enviados</SelectItem>
                <SelectItem value="delivered">Entregados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const StatusIcon = StatusIconComponents[order.status];

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <div className="h-8 w-8 relative rounded overflow-hidden">
                                  <img
                                    src={getFirstImageUrl(item.product.image_url)}
                                    alt={item.product.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{item.product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Cantidad: {item.quantity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${statusColors[order.status]}`}>
                            <StatusIcon className="h-4 w-4" />
                            <span>{statusLabels[order.status]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => 
                              updateOrderStatus.mutate({ orderId: order.id, status: value as OrderStatus })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="processing">En proceso</SelectItem>
                              <SelectItem value="shipped">Enviado</SelectItem>
                              <SelectItem value="delivered">Entregado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}