// 編集日時: 2026-05-07 (fix: BUG-1 usages fetch → adminFetch)
"use client";

import { adminFetch } from "@/lib/admin-fetch";
import { AnyEntity, Anomaly, EntityType, Facility, Incident, Module, Personnel } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface EntityPopupProps {
  entityType: EntityType;
  entityId: string;
  label: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

const ENTITY_COLORS: Record<EntityType, { border: string; badge: string; icon: string }> = {
  anomaly:   { border: "border-amber-500/60", badge: "bg-amber-900/80 text-amber-300", icon: "⚠" },
  module:    { border: "border-cyan-500/60",  badge: "bg-cyan-900/80 text-cyan-300",   icon: "⬡" },
  incident:  { border: "border-red-500/60",   badge: "bg-red-900/80 text-red-300",     icon: "⚡" },
  facility:  { border: "border-green-500/60", badge: "bg-green-900/80 text-green-300", icon: "◼" },
  personnel: { border: "border-violet-500/60",badge: "bg-violet-900/80 text-violet-300",icon: "◉" },
};

const TYPE_LABELS: Record<EntityType, string> = {
  anomaly:   "アノマリー",
  module:    "モジュール",
  incident:  "インシデント",
  facility:  "施設",
  personnel: "人員",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  Safe:        "text-green-400 border-green-600",
  Euclid:      "text-yellow-400 border-yellow-600",
  Keter:       "text-red-400 border-red-600",
  Thaumiel:    "text-violet-400 border-violet-600",
  Apollyon:    "text-orange-400 border-orange-600",
  Neutralized: "text-gray-400 border-gray-600",
  // Severity
  Minor:        "text-blue-400 border-blue-600",
  Moderate:     "text-yellow-400 border-yellow-600",
  Major:        "text-orange-400 border-orange-600",
  Critical:     "text-red-400 border-red-600",
  Catastrophic: "text-red-300 border-red-400",
  // Status
  Active:       "text-green-400 border-green-600",
  Resolved:     "text-gray-400 border-gray-600",
  Ongoing:      "text-red-400 border-red-600",
  Decommissioned:"text-gray-500 border-gray-700",
  Deprecated:   "text-gray-500 border-gray-700",
  Deceased:     "text-red-500 border-red-700",
};

export function EntityPopup({ entityType, entityId, label, anchorRef, onClose }: EntityPopupProps) {
  const [entity, setEntity] = useState<AnyEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const colors = ENTITY_COLORS[entityType];

  useEffect(() => {
    fetch(`/api/entities/${entityType}/${entityId}`)
      .then((r) => r.json())
      .then((data) => {
        setEntity(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityType, entityId]);

  useEffect(() => {
    if (!anchorRef.current) return;
    // DOM 更新後に BoundingRect を取得して競合を防ぐ
    const id = requestAnimationFrame(() => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top:  rect.bottom + 8,
        left: rect.left,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [anchorRef]);

  // Adjust if overflowing
  useEffect(() => {
    if (!popupRef.current) return;
    const id = requestAnimationFrame(() => {
      if (!popupRef.current) return;
      const r = popupRef.current.getBoundingClientRect();
      if (r.right > window.innerWidth - 16) {
        setPosition((p) => ({ ...p, left: Math.max(16, window.innerWidth - r.width - 16) }));
      }
    });
    return () => cancelAnimationFrame(id);
  }, [entity]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const renderContent = () => {
    if (!entity) return null;
    switch (entityType) {
      case "anomaly": {
        const a = entity as Anomaly;
        const cc = CLASSIFICATION_COLORS[a.classification] || "text-gray-400 border-gray-600";
        return (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${cc}`}>
                {a.classification}
              </span>
              {a.containmentClass && (
                <span className="text-[10px] font-mono border border-gray-600 px-1.5 py-0.5 rounded text-gray-400">
                  収容: {a.containmentClass}
                </span>
              )}
            </div>
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{a.description}</p>
            {a.tags && a.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {a.tags.slice(0, 4).map((t) => (
                  <span key={t} className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </>
        );
      }
      case "module": {
        const m = entity as Module;
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono border border-gray-600 px-1.5 py-0.5 rounded text-gray-400">
                {m.type}
              </span>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[m.status] || "text-gray-400 border-gray-600"}`}>
                {m.status}
              </span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{m.description}</p>
          </>
        );
      }
      case "incident": {
        const i = entity as Incident;
        return (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[i.severity] || "text-gray-400 border-gray-600"}`}>
                深刻度: {i.severity}
              </span>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[i.status] || "text-gray-400 border-gray-600"}`}>
                {i.status}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">{i.date}</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{i.description}</p>
            {i.casualties && (
              <p className="text-red-400 text-[11px] mt-1.5 font-mono">被害: {i.casualties}</p>
            )}
          </>
        );
      }
      case "facility": {
        const f = entity as Facility;
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono border border-gray-600 px-1.5 py-0.5 rounded text-gray-400">
                {f.type}
              </span>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[f.status] || "text-gray-400 border-gray-600"}`}>
                {f.status}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-mono mb-1.5">{f.location}</p>
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{f.description}</p>
            {f.director && (
              <p className="text-gray-500 text-[11px] mt-1.5">所長: {f.director}</p>
            )}
          </>
        );
      }
      case "personnel": {
        const p = entity as Personnel;
        return (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono border border-gray-600 px-1.5 py-0.5 rounded text-gray-400">
                {p.rank}
              </span>
              <span className="text-[10px] font-mono border border-gray-600 px-1.5 py-0.5 rounded text-yellow-600">
                CL-{p.clearance}
              </span>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${CLASSIFICATION_COLORS[p.status] || "text-gray-400 border-gray-600"}`}>
                {p.status}
              </span>
            </div>
            {p.codename && (
              <p className="text-violet-300 text-[11px] font-mono mb-1.5">「{p.codename}」</p>
            )}
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{p.description}</p>
          </>
        );
      }
    }
  };

  const detailPath = `/entities/${entityType}/${entityId}`;

  return (
    <div
      ref={popupRef}
      className={`fixed z-50 w-72 rounded-lg border bg-gray-900/95 backdrop-blur-sm shadow-2xl
        ${colors.border} animate-in fade-in slide-in-from-top-1 duration-150`}
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${colors.badge}`}>
            {colors.icon} {TYPE_LABELS[entityType]}
          </span>
          <span className="text-[10px] font-mono text-gray-500">{entityId}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm leading-none"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <div className="px-3 pt-2 pb-1">
        <h3 className="text-sm font-semibold text-gray-100">{label}</h3>
      </div>

      {/* Body */}
      <div className="px-3 pb-2">
        {loading ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-3 h-3 border border-gray-600 border-t-gray-300 rounded-full animate-spin" />
            <span className="text-gray-500 text-xs">読み込み中...</span>
          </div>
        ) : entity ? (
          renderContent()
        ) : (
          <p className="text-red-400 text-xs">データが見つかりません</p>
        )}
      </div>

      {/* Footer — 逆引き + 詳細リンク */}
      <UsageFooter entityId={entityId} borderCls={colors.border} detailPath={detailPath} onClose={onClose} pushFn={router.push} />
    </div>
  );
}

function UsageFooter({ entityId, borderCls, detailPath, onClose, pushFn }: {
  entityId: string; borderCls: string; detailPath: string;
  onClose: () => void; pushFn: (path: string) => void;
}) {
  const [usages, setUsages] = useState<Array<{ chapterId: string; chapterNumber: number; chapterTitle: string; novelTitle: string; novelSlug: string }>>([]);
  const [open, setOpen]   = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadUsages = async () => {
    if (loaded) { setOpen(v => !v); return; }
    const res  = await adminFetch(`/api/admin/entities/usages?id=${encodeURIComponent(entityId)}`);
    const data = await res.json();
    setUsages(Array.isArray(data) ? data : []);
    setLoaded(true); setOpen(true);
  };

  return (
    <div className="px-3 py-2 border-t border-gray-700 space-y-1.5">
      <button onClick={loadUsages}
        className="w-full text-[10px] font-mono py-1 rounded border border-gray-700 text-gray-600 hover:text-gray-400 transition-all">
        {open ? "▲ 登場箇所を隠す" : "▼ 登場する章を確認"}
      </button>
      {open && (
        <div className="space-y-0.5 max-h-28 overflow-y-auto">
          {usages.length === 0
            ? <p className="text-[10px] font-mono text-gray-700 text-center py-1">登場箇所なし</p>
            : usages.map((u) => (
                <button key={u.chapterId}
                  onClick={() => { window.open(`/novels/${u.novelSlug}?chapter=${u.chapterNumber}`, "_blank"); }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                  <span className="text-[10px] font-mono text-gray-600">{u.novelTitle} / </span>
                  <span className="text-[10px] font-mono text-gray-400">{u.chapterNumber}章 {u.chapterTitle}</span>
                </button>
              ))
          }
        </div>
      )}
      <button onClick={() => pushFn(detailPath)}
        className={`w-full text-xs font-mono py-1.5 rounded transition-all border ${borderCls} text-gray-400 hover:text-gray-100 hover:bg-gray-800`}>
        詳細を表示 →
      </button>
    </div>
  );
}
