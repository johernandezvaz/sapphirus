import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache for user roles to prevent excessive database queries
const roleCache = new Map<string, { role: string; timestamp: number }>();
const sessionCache = new Map<string, { session: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const SESSION_CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Check URL cache key
    const urlKey = req.url;
    const now = Date.now();

    // Check session cache first
    const cachedSession = sessionCache.get(urlKey);
    let session;

    if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_DURATION) {
      session = cachedSession.session;
    } else {
      // Refresh session if expired
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return redirectToAuth(req);
      }

      session = newSession;
      sessionCache.set(urlKey, { session: newSession, timestamp: now });
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

      // Check role cache
      const cachedRole = roleCache.get(userId);

      if (cachedRole && (now - cachedRole.timestamp) < CACHE_DURATION) {
        userRole = cachedRole.role;
      } else {
        // Fetch role from database with retry logic
        userRole = await fetchUserRole(supabase, userId);
        
        if (userRole) {
          roleCache.set(userId, { role: userRole, timestamp: now });
        }
      }

      // Clean up old cache entries periodically
      cleanupCache(now);

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
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
        .timeout(5000);

      if (error) throw error;
      return profile?.role;
    } catch (error) {
      lastError = error;
      
      if (attempt === retries - 1) {
        console.error('Failed to fetch user role after', retries, 'attempts:', error);
        return undefined;
      }
      
      // Exponential backoff with jitter
      const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }

  if (lastError) {
    console.error('All retries failed:', lastError);
  }

  return undefined;
}

function cleanupCache(now: number) {
  // Clean up role cache using Array.from to avoid iteration issues
  Array.from(roleCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_DURATION) {
      roleCache.delete(key);
    }
  });

  // Clean up session cache using Array.from to avoid iteration issues
  Array.from(sessionCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > SESSION_CACHE_DURATION) {
      sessionCache.delete(key);
    }
  });
}

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth', req.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/auth/:path*'],
};