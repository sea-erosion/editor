// 編集日時: 2026-04-29
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  // instrumentation.ts を有効化（Next.js 14.x以前では明示が必要）
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
