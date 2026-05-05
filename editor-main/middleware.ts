// 編集日時: 2026-05-03
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    const auth  = req.headers.get('authorization');
    const token = process.env.ADMIN_TOKEN;

    if (!token) {
      // ADMIN_TOKEN 未設定の場合は 503 を返す
      return NextResponse.json(
        { error: 'ADMIN_TOKEN is not configured on the server.' },
        { status: 503 }
      );
    }

    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 管理画面ページへのアクセスはミドルウェアでは弾かず、
  // クライアント側の LoginGate コンポーネントで制御する
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
