import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache for user roles to prevent excessive database queries
const roleCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return redirectToAuth(req);
    }

    // If no session and trying to access protected routes, redirect to auth page
    if (!session && (
      req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/profile')
    )) {
      return redirectToAuth(req);
    }

    // If there is a session, handle role-based access
    if (session) {
      const userId = session.user.id;
      let userRole: string | undefined;

      // Check cache first
      const cachedRole = roleCache.get(userId);
      const now = Date.now();

      if (cachedRole && (now - cachedRole.timestamp) < CACHE_DURATION) {
        userRole = cachedRole.role;
      } else {
        // Fetch role from database with retry logic
        userRole = await fetchUserRole(supabase, userId);
        
        if (userRole) {
          roleCache.set(userId, { role: userRole, timestamp: now });
        }
      }

      // Redirect from auth page when logged in
      if (req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(
          new URL(userRole === 'admin' ? '/dashboard' : '/', req.url)
        );
      }

      // Protect admin routes
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        if (userRole !== 'admin') {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

async function fetchUserRole(supabase: any, userId: string, retries = 3): Promise<string | undefined> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return profile?.role;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error('Failed to fetch user role after', retries, 'attempts:', error);
        return undefined;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth', req.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/auth/:path*'],
};