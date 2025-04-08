import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { CartItem } from '@/types/cart';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const event = JSON.parse(payload);

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      try {
        // Extract metadata
        const userId = paymentIntent.metadata.userId;
        const items: CartItem[] = JSON.parse(paymentIntent.metadata.items || '[]');
        
        if (!userId || !items.length) {
          throw new Error('Missing required metadata');
        }

        // Check if an order already exists for this payment intent
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', userId)
          .eq('total_amount', paymentIntent.amount / 100)
          .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Orders created in the last 5 minutes
          .limit(1);

        if (existingOrders && existingOrders.length > 0) {
          console.log(`Order already exists for payment intent ${paymentIntent.id}`);
          return NextResponse.json({ received: true, status: 'order_exists' });
        }

        // Create order in database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            status: 'processing',
            total_amount: paymentIntent.amount / 100, // Convert from cents
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items and update product stock
        for (const item of items) {
          // Add order item
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: item.price,
              created_at: new Date().toISOString()
            });

          if (itemError) throw itemError;

          // Update product stock
          // 1. Obtener el producto
const { data: product, error: fetchError } = await supabase
.from('products')
.select('stock')
.eq('id', item.productId)
.single();

if (fetchError) {
console.error('Error obteniendo producto:', fetchError.message);
return;
}

// 2. Calcular nuevo stock
const newStock = Math.max(0, product.stock - item.quantity);

// 3. Actualizar producto
const { error: updateError } = await supabase
.from('products')
.update({ stock: newStock })
.eq('id', item.productId);

if (updateError) {
console.error('Error actualizando stock:', updateError.message);
}
        }

        console.log(`Payment succeeded and order created: ${order.id}`);
      } catch (error) {
        console.error('Error processing payment success:', error);
        return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
  }
}