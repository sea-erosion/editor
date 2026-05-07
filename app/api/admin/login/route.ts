// 編集日時: 2026-05-07 (new: パスワード認証ログインAPI / fix: ブルートフォース対策レート制限追加)
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE  = 'admin_session';
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7日間

// ブルートフォース対策: 15分に5回まで
const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5 });

// POST /api/admin/login
// body: { password: string }
export async function POST(req: NextRequest) {
  // レート制限チェック（認証処理より先に行う）
  const ip     = getClientIp(req);
  const rlResult = loginLimiter.check(ip);
  if (!rlResult.ok) return rateLimitResponse(rlResult);

  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'パスワードを入力してください' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminToken    = process.env.ADMIN_TOKEN;

    if (!adminPassword || !adminToken) {
      console.error('ADMIN_PASSWORD or ADMIN_TOKEN is not set');
      return NextResponse.json(
        { error: 'サーバー設定エラー — ADMIN_PASSWORD / ADMIN_TOKEN が未設定です' },
        { status: 503 }
      );
    }

    // タイミング攻撃を防ぐため timingSafeEqual で比較
    const { timingSafeEqual } = await import('crypto');
    const expected = Buffer.from(adminPassword, 'utf-8');
    const provided = Buffer.from(password,      'utf-8');
    const ok =
      expected.length === provided.length &&
      timingSafeEqual(expected, provided);

    if (!ok) {
      // 失敗してもレート制限カウントは消費済み（再試行を抑制）
      return NextResponse.json(
        {
          error: 'パスワードが正しくありません',
          retriesLeft: rlResult.remaining,
        },
        { status: 401 }
      );
    }

    // 認証成功 — レート制限をリセットして Cookie を発行
    loginLimiter.reset(ip);

    const isSecure = req.headers.get('x-forwarded-proto') === 'https' ||
                     req.nextUrl.protocol === 'https:';
    const cookieAttrs = [
      `${SESSION_COOKIE}=${encodeURIComponent(adminToken)}`,
      'Path=/',
      `Max-Age=${SESSION_TTL_SEC}`,
      'HttpOnly',
      'SameSite=Strict',
      ...(isSecure ? ['Secure'] : []),
    ].join('; ');

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie':   cookieAttrs,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
