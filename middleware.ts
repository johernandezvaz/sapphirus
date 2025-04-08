import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Improved session cache with TTL and automatic cleanup
class SessionCache {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly ttl: number = 5 * 60 * 1000; // 5 minutes TTL
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Create singleton instances of caches
const sessionCache = new SessionCache();
const roleCache = new SessionCache();

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const pathname = req.nextUrl.pathname;
    const cacheKey = `${req.url}-${pathname}`;

    // Check session cache first
    let session = sessionCache.get(cacheKey);
    
    if (!session) {
      // Refresh session if not in cache
      const { data: { session: newSession } } = await supabase.auth.getSession();
      session = newSession;
      
      if (session) {
        sessionCache.set(cacheKey, session);
      }
    }

    // Handle protected routes
    if (!session && (
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/profile')
    )) {
      return redirectToAuth(req);
    }

    // If there is a session, handle role-based access
    if (session) {
      const userId = session.user.id;
      let userRole: string | undefined;

      // Check role cache
      userRole = roleCache.get(userId);

      if (!userRole) {
        // Implement exponential backoff for role fetching
        userRole = await fetchUserRoleWithBackoff(supabase, userId);
        
        if (userRole) {
          roleCache.set(userId, userRole);
        }
      }

      // Redirect from auth page when logged in
      if (pathname.startsWith('/auth')) {
        return NextResponse.redirect(
          new URL(userRole === 'admin' ? '/dashboard' : '/', req.url)
        );
      }

      // Protect admin routes
      if (pathname.startsWith('/dashboard')) {
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

async function fetchUserRoleWithBackoff(supabase: any, userId: string): Promise<string | undefined> {
  const maxRetries = 3;
  const baseDelay = 1000; // Start with 1 second delay

  for (let attempt = 0; attempt < maxRetries; attempt++) {
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
      if (attempt === maxRetries - 1) {
        console.error('Failed to fetch user role after', maxRetries, 'attempts:', error);
        return undefined;
      }

      // Calculate delay with exponential backoff and jitter
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return undefined;
}

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth', req.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/auth/:path*'],
};