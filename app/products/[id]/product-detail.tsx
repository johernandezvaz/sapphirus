/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/product';

export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
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

  const images = parseImageUrls(product?.image_url);

  useEffect(() => {
    if (images.length > 0 && !selectedImage) {
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: images[0],
    });

    toast({
      title: "Producto agregado",
      description: `${product.name} se ha agregado al carrito`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push('/products')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
              <div
                className="w-full h-full relative cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoomPosition({ x: 0, y: 0 })}
              >
                <img
                  src={selectedImage || images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{
                    background: `url(${selectedImage || images[0]}) no-repeat`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: '200%',
                  }}
                />
              </div>
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square rounded-md overflow-hidden ${
                      selectedImage === image ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Vista ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <Card className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-serif font-bold mb-2">
                  {product.name}
                </h1>
                <p className="text-2xl font-semibold">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              {product.size && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Talla</h3>
                  <div className="inline-block bg-secondary px-3 py-1 rounded-md">
                    {product.size}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Categoría</h3>
                <div className="inline-block bg-secondary px-3 py-1 rounded-md capitalize">
                  {product.category}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Disponibilidad</h3>
                <p className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al Carrito
              </Button>
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
}