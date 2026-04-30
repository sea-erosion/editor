import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import Link from "next/link";
import { notFound } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント",
  facility: "施設", personnel: "人員",
};

async function getEntities(type: string) {
  switch (type) {
    case "anomaly": return (await db.select().from(anomalies)).map(r => ({ id: r.id, name: r.name, subtitle: r.classification, meta: r.containmentClass }));
    case "module": return (await db.select().from(modules)).map(r => ({ id: r.id, name: r.name, subtitle: r.type, meta: r.status }));
    case "incident": return (await db.select().from(incidents)).map(r => ({ id: r.id, name: r.name, subtitle: r.severity, meta: r.date }));
    case "facility": return (await db.select().from(facilities)).map(r => ({ id: r.id, name: r.name, subtitle: r.type, meta: r.status }));
    case "personnel": return (await db.select().from(personnel)).map(r => ({ id: r.id, name: r.name, subtitle: r.rank, meta: `CL-${r.clearance}` }));
    default: return null;
  }
}

const TYPE_COLORS: Record<string, string> = {
  anomaly: "text-amber-400 border-amber-800/60 hover:border-amber-600",
  module: "text-cyan-400 border-cyan-800/60 hover:border-cyan-600",
  incident: "text-red-400 border-red-800/60 hover:border-red-600",
  facility: "text-green-400 border-green-800/60 hover:border-green-600",
  personnel: "text-violet-400 border-violet-800/60 hover:border-violet-600",
};

export default async function EntityListPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const entities = await getEntities(type);
  if (!entities) notFound();

  const colorClass = TYPE_COLORS[type] || TYPE_COLORS.anomaly;

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors">← ホーム</Link>
      </div>
      <h1 className="font-mono text-sm text-gray-400 tracking-widest uppercase mb-6">
        — {TYPE_LABELS[type]}データベース ({entities.length}件) —
      </h1>
      <div className="grid gap-2">
        {entities.map((e) => (
          <Link
            key={e.id}
            href={`/entities/${type}/${e.id}`}
            className={`flex items-center gap-4 border rounded-lg px-4 py-3 bg-gray-900/20 hover:bg-gray-900/40 transition-all ${colorClass}`}
          >
            <span className="font-mono text-[11px] text-gray-600 w-32 flex-shrink-0">{e.id}</span>
            <span className="text-gray-200 text-sm flex-1">{e.name}</span>
            <span className="text-[11px] font-mono text-gray-600">{e.subtitle}</span>
            {e.meta && <span className="text-[11px] font-mono text-gray-700">{e.meta}</span>}
            <span className="text-gray-700 text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
