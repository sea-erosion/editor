import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { EntityType } from "@/types";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const entityType = type as EntityType;

  try {
    let entity: Record<string, unknown> | undefined;

    switch (entityType) {
      case "anomaly": {
        const rows = await db.select().from(anomalies).where(eq(anomalies.id, id));
        if (rows[0]) {
          const r = rows[0];
          entity = {
            ...r,
            tags: r.tags ? JSON.parse(r.tags as string) : null,
          };
        }
        break;
      }
      case "module": {
        const rows = await db.select().from(modules).where(eq(modules.id, id));
        if (rows[0]) {
          const r = rows[0];
          entity = {
            ...r,
            specifications: r.specifications ? JSON.parse(r.specifications as string) : null,
            relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null,
          };
        }
        break;
      }
      case "incident": {
        const rows = await db.select().from(incidents).where(eq(incidents.id, id));
        if (rows[0]) {
          const r = rows[0];
          entity = {
            ...r,
            relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null,
            relatedPersonnel: r.relatedPersonnel ? JSON.parse(r.relatedPersonnel as string) : null,
          };
        }
        break;
      }
      case "facility": {
        const rows = await db.select().from(facilities).where(eq(facilities.id, id));
        if (rows[0]) {
          const r = rows[0];
          entity = {
            ...r,
            containedAnomalies: r.containedAnomalies ? JSON.parse(r.containedAnomalies as string) : null,
          };
        }
        break;
      }
      case "personnel": {
        const rows = await db.select().from(personnel).where(eq(personnel.id, id));
        if (rows[0]) {
          const r = rows[0];
          entity = {
            ...r,
            specialties: r.specialties ? JSON.parse(r.specialties as string) : null,
            relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null,
          };
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    return NextResponse.json(entity);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
