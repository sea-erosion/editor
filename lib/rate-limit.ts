// 編集日時: 2026-05-07 (new: 共通レート制限ユーティリティ)
/**
 * IPベースのインメモリレート制限
 *
 * ⚠️ サーバーレス環境（Vercel等）ではプロセスをまたいだ状態共有ができないため、
 *    同一プロセス内のリクエストのみを制限します。
 *    より厳密な制限が必要な場合は Upstash Redis 等への移行を検討してください。
 *
 * 使い方:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const result  = limiter.check(ip);
 *   if (!result.ok) return 429;
 */

export interface RateLimitOptions {
  windowMs: number; // 計測ウィンドウ（ミリ秒）
  max: number;      // ウィンドウ内の最大リクエスト数
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;  // 残りリクエスト数
  resetAt: number;    // リセット時刻（Unix ms）
}

interface Entry {
  count:   number;
  resetAt: number;
}

export function createRateLimiter(opts: RateLimitOptions) {
  const map = new Map<string, Entry>();

  // 期限切れエントリを定期的に掃除してメモリリークを防ぐ
  const gc = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (now > entry.resetAt) map.delete(key);
    }
  }, opts.windowMs * 2);
  // Node.js がプロセス終了を妨げないよう unref
  if (gc.unref) gc.unref();

  return {
    check(key: string): RateLimitResult {
      const now   = Date.now();
      const entry = map.get(key);

      if (!entry || now > entry.resetAt) {
        map.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { ok: true, remaining: opts.max - 1, resetAt: now + opts.windowMs };
      }

      if (entry.count >= opts.max) {
        return { ok: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return { ok: true, remaining: opts.max - entry.count, resetAt: entry.resetAt };
    },

    /** テスト用: 特定キーのエントリをリセット */
    reset(key: string) {
      map.delete(key);
    },
  };
}

/**
 * リクエストからクライアントIPを取得する
 * プロキシ環境では x-forwarded-for を優先する
 */
export function getClientIp(req: Request): string {
  const fwd = (req.headers as Headers).get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = (req.headers as Headers).get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/**
 * レート制限超過時のレスポンスを生成する
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After':  String(retryAfterSec),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
