"use client"

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "¿Cuánto tiempo tarda el envío?",
      answer: "Los envíos generalmente tardan entre 3-5 días hábiles dentro de la ciudad y 5-7 días hábiles para envíos nacionales."
    },
    {
      question: "¿Ofrecen garantía en los productos?",
      answer: "Sí, todos nuestros productos cuentan con garantía de autenticidad y contra defectos de fábrica."
    },
    {
      question: "¿Cómo puedo rastrear mi pedido?",
      answer: "Una vez que tu pedido sea enviado, recibirás un correo electrónico con el número de seguimiento."
    },
    {
      question: "¿Cuál es su política de devoluciones?",
      answer: "Aceptamos devoluciones dentro de los primeros 30 días después de la compra, siempre y cuando el producto esté en su estado original."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <section className="py-20 bg-background" id="FAQs">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-serif font-bold text-center mb-12"
        >
          Preguntas Frecuentes
        </motion.h2>
        <motion.div 
          className="max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}