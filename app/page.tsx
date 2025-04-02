import Hero from '@/components/hero';
import FeaturedProducts from '@/components/featured-products';
import AboutSection from '@/components/about-section';
import TestimonialsSection from '@/components/testimonials-section';
import ContactSection from '@/components/contact-section';
import FAQSection from '@/components/faq-section';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <AboutSection />
      <FeaturedProducts />
      <TestimonialsSection />
      <ContactSection />
      <FAQSection />
    </div>
  );
}