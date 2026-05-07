// 編集日時: 2026-05-05
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
