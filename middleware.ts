// 編集日時: 2026-05-07 (refactor: localStorage廃止・HttpOnly Cookie + パスワード認証方式に移行)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── /api/admin/login, /api/admin/logout は認証不要 ──────────────
  if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return NextResponse.next();
  }

  // ── /api/admin/** : Cookie 認証（HttpOnly） ──────────────────────
  if (pathname.startsWith('/api/admin')) {
    const token = process.env.ADMIN_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'ADMIN_TOKEN is not configured on the server.' },
        { status: 503 }
      );
    }
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (decodeURIComponent(session ?? '') !== token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── /admin/** (ログインページを除く) : Cookie 認証 ───────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = process.env.ADMIN_TOKEN;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'server_config');
      return NextResponse.redirect(url);
    }
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (decodeURIComponent(session ?? '') !== token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      // P-8: '//' 始まりを除外してオープンリダイレクト防止
      const safePath = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/admin';
      url.searchParams.set('from', safePath);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};
