/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { requireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Product, ProductFormData } from '@/types/product';

export default function ProductsManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    requireAuth('admin');
    document.title = 'Sapphirus - Gestión de Productos';
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setUploadedImages(parseImageUrls(editingProduct.image_url));
    }
  }, [editingProduct]);

  // Helper function to get the first valid image URL
  const getFirstImageUrl = (imageUrl: string | string[]): string => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
    
    if (typeof imageUrl === 'string') {
      try {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
      } catch {
        return imageUrl;
      }
    }
    
    return Array.isArray(imageUrl) && imageUrl.length > 0 
      ? imageUrl[0] 
      : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
  };

  // Helper function to parse image URLs
  const parseImageUrls = (imageUrl: string | string[]): string[] => {
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

  // Fetch all products for admin
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    }
  });

  // Add product mutation
  const addProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...data,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setUploadedImages([]);
      toast({
        title: "Éxito",
        description: "Producto creado exitosamente",
      });
    }
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setEditingProduct(null);
      setUploadedImages([]);
      toast({
        title: "Éxito",
        description: "Producto actualizado exitosamente",
      });
    }
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductToDelete(null);
      toast({
        title: "Éxito",
        description: "Producto eliminado exitosamente",
      });
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 5;

    if (uploadedImages.length + files.length > maxImages) {
      toast({
        title: "Error",
        description: `Máximo ${maxImages} imágenes permitidas`,
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive"
        });
        continue;
      }

      try {
        const imageUrl = await uploadToCloudinary(file);
        setUploadedImages(prev => [...prev, imageUrl]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al subir la imagen",
          variant: "destructive"
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const productData: ProductFormData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        stock: parseInt(formData.get('stock') as string),
        size: formData.get('size') as string || undefined,
        image_url: uploadedImages
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data: productData });
      } else {
        await addProduct.mutateAsync(productData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gestión de Productos</CardTitle>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
                setUploadedImages([]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </CardHeader>
          <CardContent>
            {showProductForm && (
              <form onSubmit={handleSubmit} className="mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre del Producto
                    </label>
                    <Input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingProduct?.name}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Categoría
                    </label>
                    <select
                      name="category"
                      required
                      defaultValue={editingProduct?.category}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Seleccionar categoría</option>
                      <option value="clothing">Ropa</option>
                      <option value="shoes">Zapatos</option>
                      <option value="accessories">Accesorios</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Precio
                    </label>
                    <Input
                      type="number"
                      name="price"
                      step="0.01"
                      required
                      defaultValue={editingProduct?.price}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stock
                    </label>
                    <Input
                      type="number"
                      name="stock"
                      min="0"
                      required
                      defaultValue={editingProduct?.stock}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Talla (Opcional)
                    </label>
                    <Input
                      type="text"
                      name="size"
                      defaultValue={editingProduct?.size}
                      placeholder="Ej: S, M, L, XL, 42, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descripción
                  </label>
                  <Textarea
                    name="description"
                    rows={3}
                    required
                    defaultValue={editingProduct?.description}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Imágenes del Producto (Máximo 5)
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                    {uploadedImages.length < 5 && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-center p-4"
                        >
                          <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                          <span className="mt-2 block text-sm font-medium text-muted-foreground">
                            Agregar imagen
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      setUploadedImages([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadedImages.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                        Guardando...
                      </>
                    ) : (
                      editingProduct ? 'Actualizar Producto' : 'Guardar Producto'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map(product => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={getFirstImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                    </div>
                    {product.size && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Talla: {product.size}
                      </p>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <span className={`text-sm ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.stock > 0 ? 'En stock' : 'Agotado'}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setProductToDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El producto será eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setProductToDelete(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (productToDelete) {
                                    deleteProduct.mutate(productToDelete.id);
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}