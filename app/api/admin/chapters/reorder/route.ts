// 編集日時: 2026-05-07 (fix: BUG-6 並び替え後にnovels.updatedAtを更新)
import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/chapters/reorder
// body: { orders: [{ id: string, chapterNumber: number }] }
export async function POST(req: NextRequest) {
  try {
    const { orders } = await req.json() as { orders: Array<{ id: string; chapterNumber: number }> };
    if (!Array.isArray(orders)) return NextResponse.json({ error: "orders required" }, { status: 400 });
    await Promise.all(
      orders.map(({ id, chapterNumber }) =>
        db.update(chapters).set({ chapterNumber }).where(eq(chapters.id, id))
      )
    );
    // 並び替えた章の novelId を取得して親小説の updatedAt を更新
    if (orders.length > 0) {
      const firstChapter = await db.select({ novelId: chapters.novelId })
        .from(chapters).where(eq(chapters.id, orders[0].id));
      if (firstChapter[0]) {
        await db.update(novels).set({ updatedAt: new Date() })
          .where(eq(novels.id, firstChapter[0].novelId));
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
