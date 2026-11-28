import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@toland/shared';
import {
  canUserAccessAdminPath,
  getFirstAllowedAdminPath,
  isPrimarySuperAdmin,
  isTeamRole,
  resolveUserPermissions,
  resolveUserRole,
} from '@/lib/rbac';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fast-path: Static files, Next internals, assets, webhooks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/auth');

  // Check if any Supabase auth cookies exist
  const hasAuthCookies = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.value);

  // 2. High-speed bypass: For all public storefront routes without auth cookies, skip Supabase Auth completely!
  if (!isAdminRoute && !isAuthRoute && !hasAuthCookies) {
    return NextResponse.next();
  }

  // 3. For public storefront routes even with cookies, pass through to avoid blocking SSR rendering
  if (!isAdminRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin route protection: /admin/*
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Fetch live profile role & permissions for instant enforcement of Super Admin changes
    const { data: liveProfile } = await (supabase as any)
      .from('profiles')
      .select('role, permissions')
      .eq('id', user.id)
      .maybeSingle();

    const effectiveUser = {
      email: user.email,
      app_metadata: {
        ...(user.app_metadata || {}),
        ...(liveProfile?.role ? { role: liveProfile.role } : {}),
        ...(liveProfile && liveProfile.permissions !== undefined
          ? { permissions: liveProfile.permissions }
          : {}),
      },
      user_metadata: user.user_metadata,
    };

    const role = resolveUserRole(effectiveUser);
    const permissions = resolveUserPermissions(effectiveUser);
    const superAdmin = isPrimarySuperAdmin(user);

    if (!superAdmin && (!isTeamRole(role) || permissions.length === 0)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    if (!canUserAccessAdminPath(effectiveUser, pathname)) {
      const fallbackPath = getFirstAllowedAdminPath(effectiveUser) || '/';
      if (fallbackPath !== pathname) {
        const url = request.nextUrl.clone();
        url.pathname = fallbackPath;
        return NextResponse.redirect(url);
      }
    }
  }

  // Auth route redirect if already logged in with team privileges
  if (isAuthRoute && pathname === '/auth/login' && user) {
    const role = resolveUserRole(user);
    if (isTeamRole(role) && resolveUserPermissions(user).length > 0) {
      const firstPath = getFirstAllowedAdminPath(user) || '/admin';
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || firstPath;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return response;
}
