"use client"

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TestimonialsSection() {
  const testimonials = [
    {
      content: "Excelente servicio y productos de alta calidad. Definitivamente volveré a comprar.",
      author: "María González",
      image: "/logo-black.png",
      rating: 5
    },
    {
      content: "Los productos llegaron en perfecto estado y antes de lo esperado. Muy recomendable.",
      author: "Carlos Ramírez",
      image: "/logo-black.png",
      rating: 4.5
    },
    {
      content: "La atención al cliente es excepcional. Resolvieron todas mis dudas rápidamente.",
      author: "Laura Mendoza",
      image: "/logo-black.png",
      rating: 5
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-serif font-bold text-center mb-12"
        >
          Lo Que Dicen Nuestros Clientes
        </motion.h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < testimonial.rating ? 'fill-current' : 'stroke-current'}`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium">{testimonial.author}</h4>
                      <span className="text-sm text-muted-foreground">Cliente Verificado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}