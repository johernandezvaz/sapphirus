import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

<<<<<<< HEAD
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to auth page for protected routes
=======
  // Refresh session if expired - required for auto session refresh
  const { data: { session }, error } = await supabase.auth.getSession();

  // If no session and trying to access protected routes, redirect to auth page
>>>>>>> d05fbbe30486634cd3d9756ae0528ce847900aa3
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/profile')
  )) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // If there is a session, fetch the user's role
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Redirect from auth page when logged in
    if (req.nextUrl.pathname.startsWith('/auth')) {
      // Redirect admins to dashboard, clients to home
      return NextResponse.redirect(
        new URL(profile?.role === 'admin' ? '/dashboard' : '/', req.url)
      );
    }

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/auth/:path*'],
};