export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const statusIcons = {
  pending: 'Clock',
  processing: 'Package',
  shipped: 'Package',
  delivered: 'CheckCircle',
  cancelled: 'XCircle',
} as const;

export const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  shipped: 'text-purple-500',
  delivered: 'text-green-500',
  cancelled: 'text-red-500',
} as const;

export const statusLabels = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
} as const;