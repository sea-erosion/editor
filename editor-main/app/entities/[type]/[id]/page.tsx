import { db } from "@/db/client";
import { anomalies, facilities, incidents, modules, personnel } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

const TYPE_LABELS: Record<string, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント",
  facility: "施設", personnel: "人員",
};

const TYPE_COLORS: Record<string, { header: string; badge: string; border: string }> = {
  anomaly:   { header: "border-amber-700/40 bg-amber-950/10", badge: "bg-amber-900/60 text-amber-300 border-amber-700", border: "border-amber-700/30" },
  module:    { header: "border-cyan-700/40 bg-cyan-950/10",   badge: "bg-cyan-900/60 text-cyan-300 border-cyan-700",   border: "border-cyan-700/30" },
  incident:  { header: "border-red-700/40 bg-red-950/10",     badge: "bg-red-900/60 text-red-300 border-red-700",     border: "border-red-700/30" },
  facility:  { header: "border-green-700/40 bg-green-950/10", badge: "bg-green-900/60 text-green-300 border-green-700",border: "border-green-700/30" },
  personnel: { header: "border-violet-700/40 bg-violet-950/10",badge: "bg-violet-900/60 text-violet-300 border-violet-700",border: "border-violet-700/30" },
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  Safe:"text-green-400", Euclid:"text-yellow-400", Keter:"text-red-400",
  Thaumiel:"text-violet-400", Critical:"text-red-400", Major:"text-orange-400",
  Active:"text-green-400", Resolved:"text-gray-400", Ongoing:"text-red-400",
};

type EntityView = Record<string, unknown> & {
  id: string;
  name?: string | null;
  codename?: string | null;
  classification?: string | null;
  severity?: string | null;
  containmentClass?: string | null;
  riskClass?: string | null;
  disruptionClass?: string | null;
  description: string;
  containmentProcedures?: string | null;
  addendum?: string | null;
  tags?: string[] | null;
  specifications?: Record<string, string> | string[] | null;
  relatedAnomalies?: string[] | null;
  relatedPersonnel?: string[] | null;
  type: string;
  status: string;
  date: string;
  location?: string | null;
  casualties?: string | null;
  capacity?: number | null;
  director?: string | null;
  containedAnomalies?: string[] | null;
  rank: string;
  clearance: number;
  assignedFacility?: string | null;
  specialties?: string[] | null;
};

async function getEntity(type: string, id: string) {
  switch (type) {
    case "anomaly": {
      const rows = await db.select().from(anomalies).where(eq(anomalies.id, id));
      if (!rows[0]) return null;
      const r = rows[0];
      return { type: "anomaly", entity: { ...r, tags: r.tags ? JSON.parse(r.tags as string) : null } };
    }
    case "module": {
      const rows = await db.select().from(modules).where(eq(modules.id, id));
      if (!rows[0]) return null;
      const r = rows[0];
      return { type: "module", entity: { ...r, specifications: r.specifications ? JSON.parse(r.specifications as string) : null, relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null } };
    }
    case "incident": {
      const rows = await db.select().from(incidents).where(eq(incidents.id, id));
      if (!rows[0]) return null;
      const r = rows[0];
      return { type: "incident", entity: { ...r, relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null, relatedPersonnel: r.relatedPersonnel ? JSON.parse(r.relatedPersonnel as string) : null } };
    }
    case "facility": {
      const rows = await db.select().from(facilities).where(eq(facilities.id, id));
      if (!rows[0]) return null;
      const r = rows[0];
      return { type: "facility", entity: { ...r, containedAnomalies: r.containedAnomalies ? JSON.parse(r.containedAnomalies as string) : null } };
    }
    case "personnel": {
      const rows = await db.select().from(personnel).where(eq(personnel.id, id));
      if (!rows[0]) return null;
      const r = rows[0];
      return { type: "personnel", entity: { ...r, specialties: r.specialties ? JSON.parse(r.specialties as string) : null, relatedAnomalies: r.relatedAnomalies ? JSON.parse(r.relatedAnomalies as string) : null } };
    }
    default: return null;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-mono text-[11px] text-gray-500 tracking-widest uppercase mb-2 pb-1 border-b border-gray-800">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={`inline-block text-[11px] font-mono border px-2 py-0.5 rounded ${colorClass || "border-gray-700 text-gray-400"}`}>
      {label}
    </span>
  );
}

export default async function EntityDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const data = await getEntity(type, id);
  if (!data) notFound();

  const colors = TYPE_COLORS[type] || TYPE_COLORS.anomaly;
  const entity = data.entity as unknown as EntityView;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/entities/${type}`} className="text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors">
          ← {TYPE_LABELS[type]}一覧
        </Link>
      </div>

      <div className={`border rounded-xl overflow-hidden ${colors.header}`}>
        {/* Document header */}
        <div className={`px-6 py-4 border-b ${colors.border}`}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] font-mono border px-2 py-0.5 rounded ${colors.badge}`}>
              {TYPE_LABELS[type]}
            </span>
            <span className="text-[11px] font-mono text-gray-600">{id}</span>
            {entity.classification && (
              <span className={`text-[11px] font-mono ${CLASSIFICATION_COLORS[entity.classification] || "text-gray-400"}`}>
                {entity.classification}
              </span>
            )}
            {entity.severity && (
              <span className={`text-[11px] font-mono ${CLASSIFICATION_COLORS[entity.severity] || "text-gray-400"}`}>
                深刻度: {entity.severity}
              </span>
            )}
          </div>
          <h1 className="text-xl font-serif text-gray-100 font-medium">
            {entity.name || entity.codename || id}
          </h1>
          {entity.codename && type === "personnel" && (
            <p className="text-violet-400 text-sm font-mono mt-0.5">「{entity.codename}」</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Anomaly */}
          {type === "anomaly" && (() => {
            const a = entity;
            return (
              <>
                {(a.containmentClass || a.riskClass || a.disruptionClass) && (
                  <Section title="分類詳細">
                    <div className="flex gap-2 flex-wrap">
                      {a.containmentClass && <Badge label={`収容クラス: ${a.containmentClass}`} colorClass="border-amber-800 text-amber-400" />}
                      {a.riskClass && <Badge label={`リスク: ${a.riskClass}`} colorClass="border-red-800 text-red-400" />}
                      {a.disruptionClass && <Badge label={`混乱: ${a.disruptionClass}`} colorClass="border-orange-800 text-orange-400" />}
                    </div>
                  </Section>
                )}
                {a.containmentProcedures && (
                  <Section title="特別収容プロトコル">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{a.containmentProcedures}</p>
                  </Section>
                )}
                <Section title="説明">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{a.description}</p>
                </Section>
                {a.addendum && (
                  <Section title="付記">
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{a.addendum}</p>
                  </Section>
                )}
                {a.tags && a.tags.length > 0 && (
                  <Section title="タグ">
                    <div className="flex gap-1.5 flex-wrap">
                      {a.tags.map((t: string) => <Badge key={t} label={t} />)}
                    </div>
                  </Section>
                )}
              </>
            );
          })()}

          {/* Module */}
          {type === "module" && (() => {
            const m = entity;
            return (
              <>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge label={m.type} colorClass="border-gray-700 text-gray-400" />
                  <Badge label={m.status} colorClass={`border-gray-700 ${CLASSIFICATION_COLORS[m.status] || "text-gray-400"}`} />
                </div>
                <Section title="説明">
                  <p className="text-gray-300 text-sm leading-relaxed">{m.description}</p>
                </Section>
                {m.specifications && (
                  <Section title="仕様">
                    <div className="font-mono text-xs space-y-1">
                      {Object.entries(m.specifications as Record<string, string>).map(([k, v]) => (
                        <div key={k} className="flex gap-3">
                          <span className="text-gray-600 w-40 flex-shrink-0">{k}</span>
                          <span className="text-gray-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                {m.relatedAnomalies && m.relatedAnomalies.length > 0 && (
                  <Section title="関連アノマリー">
                    <div className="flex gap-1.5 flex-wrap">
                      {m.relatedAnomalies.map((aid: string) => (
                        <Link key={aid} href={`/entities/anomaly/${aid}`} className="text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-xs font-mono hover:bg-amber-950/30 transition-colors">{aid}</Link>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            );
          })()}

          {/* Incident */}
          {type === "incident" && (() => {
            const i = entity;
            return (
              <>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge label={i.date} colorClass="border-gray-700 text-gray-400" />
                  {i.location && <Badge label={i.location} colorClass="border-gray-700 text-gray-500" />}
                  <Badge label={i.status} colorClass={`border-gray-700 ${CLASSIFICATION_COLORS[i.status] || "text-gray-400"}`} />
                </div>
                <Section title="説明">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{i.description}</p>
                </Section>
                {i.casualties && (
                  <Section title="被害状況">
                    <p className="text-red-400 text-sm font-mono">{i.casualties}</p>
                  </Section>
                )}
                {i.relatedPersonnel && i.relatedPersonnel.length > 0 && (
                  <Section title="関連人員">
                    <div className="flex gap-1.5 flex-wrap">
                      {i.relatedPersonnel.map((pid: string) => (
                        <Link key={pid} href={`/entities/personnel/${pid}`} className="text-violet-400 border border-violet-800 px-2 py-0.5 rounded text-xs font-mono hover:bg-violet-950/30 transition-colors">{pid}</Link>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            );
          })()}

          {/* Facility */}
          {type === "facility" && (() => {
            const f = entity;
            return (
              <>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge label={f.type} colorClass="border-gray-700 text-gray-400" />
                  <Badge label={f.status} colorClass={`border-gray-700 ${CLASSIFICATION_COLORS[f.status] || "text-gray-400"}`} />
                  {f.capacity && <Badge label={`収容人数: ${f.capacity}`} colorClass="border-gray-700 text-gray-400" />}
                </div>
                <Section title="所在地">
                  <p className="text-gray-400 text-sm font-mono">{f.location}</p>
                </Section>
                <Section title="説明">
                  <p className="text-gray-300 text-sm leading-relaxed">{f.description}</p>
                </Section>
                {f.director && <Section title="所長"><p className="text-gray-400 text-sm">{f.director}</p></Section>}
                {f.containedAnomalies && f.containedAnomalies.length > 0 && (
                  <Section title="収容中アノマリー">
                    <div className="flex gap-1.5 flex-wrap">
                      {f.containedAnomalies.map((aid: string) => (
                        <Link key={aid} href={`/entities/anomaly/${aid}`} className="text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-xs font-mono hover:bg-amber-950/30 transition-colors">{aid}</Link>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            );
          })()}

          {/* Personnel */}
          {type === "personnel" && (() => {
            const p = entity;
            return (
              <>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge label={p.rank} colorClass="border-violet-800 text-violet-400" />
                  <Badge label={`クリアランスレベル ${p.clearance}`} colorClass="border-yellow-800 text-yellow-600" />
                  <Badge label={p.status} colorClass={`border-gray-700 ${CLASSIFICATION_COLORS[p.status] || "text-gray-400"}`} />
                </div>
                {p.assignedFacility && (
                  <Section title="配属施設">
                    <Link href={`/entities/facility/${p.assignedFacility}`} className="text-green-400 text-sm font-mono hover:underline">{p.assignedFacility}</Link>
                  </Section>
                )}
                <Section title="説明">
                  <p className="text-gray-300 text-sm leading-relaxed">{p.description}</p>
                </Section>
                {p.specialties && p.specialties.length > 0 && (
                  <Section title="専門分野">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.specialties.map((s: string) => <Badge key={s} label={s} />)}
                    </div>
                  </Section>
                )}
                {p.relatedAnomalies && p.relatedAnomalies.length > 0 && (
                  <Section title="関連アノマリー">
                    <div className="flex gap-1.5 flex-wrap">
                      {p.relatedAnomalies.map((aid: string) => (
                        <Link key={aid} href={`/entities/anomaly/${aid}`} className="text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-xs font-mono hover:bg-amber-950/30 transition-colors">{aid}</Link>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
