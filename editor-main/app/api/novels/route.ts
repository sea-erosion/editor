import { db } from "@/db/client";
import { novels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allNovels = await db.select().from(novels).where(eq(novels.status, "published"));
    return NextResponse.json(allNovels);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
