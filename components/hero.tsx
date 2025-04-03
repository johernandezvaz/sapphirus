/* eslint-disable @next/next/no-img-element */
"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <div className="relative h-[80vh] bg-gradient-to-r from-blue-gray to-beige overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8"
          alt="Hero background"
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
          Bienvenido a Sapphirus
          </h1>
          <p className="text-xl text-white/90 mb-8">
          Tu tienda de productos americanos en Chihuahua
          </p>
          <Button
            size="lg"
            className="bg-white text-dark hover:bg-light-gray transition-colors"
          >
            Conocenos
          </Button>
        </motion.div>
      </div>
    </div>
  );
}