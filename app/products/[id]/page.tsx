import { supabase } from '@/lib/supabase';
import ProductDetail from './product-detail';

// This function is required for static site generation with dynamic routes
export async function generateStaticParams() {
  const { data: products } = await supabase
    .from('products')
    .select('id');

  return (products || []).map((product) => ({
    id: product.id,
  }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetail id={params.id} />;
}