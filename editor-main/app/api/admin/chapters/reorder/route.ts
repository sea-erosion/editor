// 編集日時: 2026-04-29
import { db } from "@/db/client";
import { chapters } from "@/db/schema";
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
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
