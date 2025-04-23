"use client"

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import CheckoutForm from './checkout-form';
import { CartItem } from '@/types/cart';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  items: CartItem[];
}

export default function PaymentForm({ amount, onSuccess, onCancel, items }: PaymentFormProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No authenticated session');

        // Use the full API URL from environment variable
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/create-payment-intent`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            items,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Payment intent error:', error);
        toast({
          title: "Error",
          description: "Error al procesar el pago. Por favor, intenta nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, items, toast]);

  if (isLoading || !stripe || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Elements stripe={stripe} options={{ 
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#708090',
        }
      }
    }}>
      <CheckoutForm 
        onSuccess={onSuccess} 
        onCancel={onCancel}
        items={items}
        total={amount}
      />
    </Elements>
  );
}