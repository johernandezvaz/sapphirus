import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    return {
      session,
      role: profile?.role
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
}

export async function requireAuth(role?: 'admin' | 'client') {
  const auth = await checkUser();
  
  if (!auth?.session) {
    window.location.href = '/auth';
    return null;
  }

  if (role && auth.role !== role) {
    window.location.href = '/';
    return null;
  }

  return auth;
}