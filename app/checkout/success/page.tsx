"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    clearCart();
    document.title = 'Sapphirus - Pago Exitoso';
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-muted/50 pt-20">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
          </motion.div>
          
          <h1 className="text-3xl font-serif font-bold mt-8 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Gracias por tu compra. Hemos recibido tu pago y estamos procesando tu pedido.
          </p>

          <div className="space-y-4">
            <Button
              size="lg"
              onClick={() => router.push('/orders')}
              className="w-full sm:w-auto"
            >
              Ver Mis Pedidos
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/products')}
              className="w-full sm:w-auto"
            >
              Seguir Comprando
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}