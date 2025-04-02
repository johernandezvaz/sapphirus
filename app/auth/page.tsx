"use client"

import { useEffect } from 'react';
import AuthForm from '@/components/auth/auth-form';

export default function AuthPage() {
  useEffect(() => {
    document.title = 'Sapphirus - Iniciar Sesión';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg">
        <AuthForm />
      </div>
    </div>
  );
}