import { db } from "@/db/client";
import { chapters, novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const allNovels = await db.select().from(novels).where(eq(novels.status, "published"));
    return NextResponse.json(allNovels);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
