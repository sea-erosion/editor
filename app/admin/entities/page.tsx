// 編集日時: 2026-05-03
"use client";

import { adminFetch } from "@/lib/admin-fetch";
import React, { useEffect, useRef, useState } from "react";

type EntityType = "anomaly" | "module" | "incident" | "facility" | "personnel";

const TYPE_LABELS: Record<EntityType, string> = {
  anomaly: "アノマリー", module: "モジュール", incident: "インシデント",
  facility: "施設", personnel: "人員",
};

const TYPE_COLORS: Record<EntityType, string> = {
  anomaly: "text-amber-400 border-amber-800",
  module: "text-cyan-400 border-cyan-800",
  incident: "text-red-400 border-red-800",
  facility: "text-green-400 border-green-800",
  personnel: "text-violet-400 border-violet-800",
};

const ENTITY_FIELDS: Record<EntityType, Array<{ key: string; label: string; type?: string; required?: boolean; options?: string[] }>> = {
  anomaly: [
    { key: "id",                   label: "ID (例: SCP-XXXX)",         required: true },
    { key: "name",                 label: "名称",                       required: true },
    { key: "classification",       label: "分類",                       required: true, options: ["Safe","Euclid","Keter","Thaumiel","Apollyon","Neutralized"] },
    { key: "containmentClass",     label: "収容クラス",                 options: ["Safe","Euclid","Keter","Thaumiel","Apollyon"] },
    { key: "riskClass",            label: "リスククラス",               options: ["Notice","Caution","Warning","Critical","Catastrophic"] },
    { key: "disruptionClass",      label: "混乱クラス",                 options: ["Dark","Vlam","Keneq","Ekhi","Amida"] },
    { key: "description",          label: "説明",                       required: true, type: "textarea" },
    { key: "containmentProcedures",label: "特別収容プロトコル",        type: "textarea" },
    { key: "addendum",             label: "付記",                       type: "textarea" },
    { key: "tags",                 label: "タグ (カンマ区切り)",        type: "tags" },
  ],
  module: [
    { key: "id",           label: "ID (例: MOD-XXX)",   required: true },
    { key: "name",         label: "名称",                required: true },
    { key: "type",         label: "種別",                required: true, options: ["Equipment","Protocol","System","Software","Hardware"] },
    { key: "status",       label: "状態",                required: true, options: ["Active","Deprecated","Classified","Testing"] },
    { key: "description",  label: "説明",                required: true, type: "textarea" },
    { key: "specifications",label: "仕様 (JSON)",        type: "json" },
    { key: "relatedAnomalies", label: "関連アノマリー (カンマ区切り)", type: "tags" },
  ],
  incident: [
    { key: "id",       label: "ID (例: INC-YYYY-XXXX)", required: true },
    { key: "name",     label: "名称",                   required: true },
    { key: "severity", label: "深刻度",                 required: true, options: ["Minor","Moderate","Major","Critical","Catastrophic"] },
    { key: "status",   label: "状態",                   required: true, options: ["Resolved","Ongoing","Under Investigation","Classified"] },
    { key: "date",     label: "発生日 (YYYY-MM-DD)",    required: true },
    { key: "location", label: "発生場所" },
    { key: "description", label: "説明",                required: true, type: "textarea" },
    { key: "casualties",   label: "被害状況",           type: "textarea" },
    { key: "relatedAnomalies", label: "関連アノマリー (カンマ区切り)", type: "tags" },
    { key: "relatedPersonnel", label: "関連人員 (カンマ区切り)",       type: "tags" },
  ],
  facility: [
    { key: "id",       label: "ID (例: SITE-XX)",    required: true },
    { key: "name",     label: "名称",                required: true },
    { key: "type",     label: "種別",                required: true, options: ["Containment","Research","Administrative","Forward","Mobile"] },
    { key: "location", label: "所在地",               required: true },
    { key: "status",   label: "状態",                required: true, options: ["Active","Decommissioned","Compromised","Classified"] },
    { key: "description", label: "説明",              required: true, type: "textarea" },
    { key: "director", label: "所長" },
    { key: "capacity", label: "収容人数",             type: "number" },
    { key: "containedAnomalies", label: "収容アノマリー (カンマ区切り)", type: "tags" },
  ],
  personnel: [
    { key: "id",       label: "ID (例: PRSN-XXXX)",  required: true },
    { key: "name",     label: "氏名",                required: true },
    { key: "codename", label: "コードネーム" },
    { key: "rank",     label: "階級",                required: true, options: ["D-Class","Researcher","Senior Researcher","Agent","Field Agent","Director","O5"] },
    { key: "clearance",label: "クリアランスレベル",  required: true, type: "number", options: ["1","2","3","4","5"] },
    { key: "status",   label: "状態",                required: true, options: ["Active","Deceased","Missing","KIA","Reassigned","Retired"] },
    { key: "description", label: "説明",              required: true, type: "textarea" },
    { key: "specialties",  label: "専門分野 (カンマ区切り)", type: "tags" },
    { key: "assignedFacility", label: "配属施設 (例: SITE-19)" },
    { key: "relatedAnomalies", label: "関連アノマリー (カンマ区切り)", type: "tags" },
  ],
};

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none focus:border-amber-700 transition-colors";
const selectCls = inputCls;

// 誤タップ防止: 1回目で「確認」→2回目で実行
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 2500);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <button
      onClick={handleClick}
      className={`px-2 py-1 rounded text-xs font-mono transition-all
        ${confirming
          ? "text-red-400 border border-red-700/60 bg-red-950/20 hover:bg-red-900/30"
          : "text-red-900 hover:text-red-500 hover:bg-gray-800/60"
        }`}
    >
      {confirming ? "本当に削除？" : "削除"}
    </button>
  );
}

export default function EntitiesAdminPage() {
  const [activeType, setActiveType] = useState<EntityType>("anomaly");
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntities = async (type: EntityType) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/entities?type=${type}&full=1`);
      const data = await res.json();
      setEntities(Array.isArray(data) ? data : []);
    } catch { setEntities([]); }
    setLoading(false);
  };

  useEffect(() => { loadEntities(activeType); }, [activeType]);

  const openNew = () => {
    setFormData({});
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (entity: Record<string, unknown>) => {
    const fd: Record<string, string> = {};
    for (const [k, v] of Object.entries(entity)) {
      if (v === null || v === undefined) continue;
      // DBから返るJSON文字列配列をカンマ区切り表示に変換
      if (typeof v === "string" && v.startsWith("[")) {
        try { const arr = JSON.parse(v); fd[k] = Array.isArray(arr) ? arr.join(", ") : v; continue; }
        catch { /* fall through */ }
      }
      if (Array.isArray(v)) { fd[k] = v.join(", "); continue; }
      if (typeof v === "object") { fd[k] = JSON.stringify(v, null, 2); continue; }
      fd[k] = String(v);
    }
    setFormData(fd);
    setEditingId(entity.id as string);
    setError("");
    setShowForm(true);
  };

  const parseField = (key: string, value: string, fieldDef: { type?: string }) => {
    if (!value.trim()) return undefined;
    if (fieldDef.type === "tags") return value.split(",").map((s) => s.trim()).filter(Boolean);
    if (fieldDef.type === "json") {
      try { return JSON.parse(value); } catch { return value; }
    }
    if (fieldDef.type === "number") return Number(value);
    return value;
  };

  const handleSave = async () => {
    const fields = ENTITY_FIELDS[activeType];
    for (const f of fields) {
      if (f.required && !formData[f.key]?.trim()) {
        setError(`「${f.label}」は必須です`);
        return;
      }
    }
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = formData[f.key];
      if (raw !== undefined && raw !== "") {
        const parsed = parseField(f.key, raw, f);
        if (parsed !== undefined) body[f.key] = parsed;
      }
    }

    try {
      let res: Response;
      if (editingId) {
        res = await adminFetch(`/api/admin/entities/${activeType}/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await adminFetch(`/api/admin/entities?type=${activeType}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const d = await res.json();
      if (!res.ok) { setError(d.error || "エラー"); setSaving(false); return; }
      setShowForm(false);
      loadEntities(activeType);
    } catch { setError("サーバーエラー"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`「${id}」を削除しますか？`)) return;
    await adminFetch(`/api/admin/entities/${activeType}/${id}`, { method: "DELETE" });
    loadEntities(activeType);
  };

  const fields = ENTITY_FIELDS[activeType];

  return (
    <div className="flex h-screen bg-[#06090c] text-gray-300 overflow-hidden">
      {/* Type sidebar */}
      <aside className="w-44 flex-shrink-0 border-r border-gray-800 bg-[#080c10] pt-4">
        <p className="px-3 text-[10px] font-mono text-gray-700 tracking-widest uppercase mb-2">エンティティ</p>
        {(Object.keys(TYPE_LABELS) as EntityType[]).map((type) => (
          <button key={type} onClick={() => setActiveType(type)}
            className={`w-full text-left px-3 py-2.5 text-xs font-mono transition-colors
              ${activeType === type ? "bg-gray-800/60 text-gray-100 border-r-2 border-amber-600" : "text-gray-600 hover:text-gray-400 hover:bg-gray-800/20"}`}>
            <span className={`mr-2 ${TYPE_COLORS[type].split(" ")[0]}`}>
              {({ anomaly: "⚠", module: "⬡", incident: "⚡", facility: "◼", personnel: "◉" } as Record<EntityType, string>)[type]}
            </span>
            {TYPE_LABELS[type]}
          </button>
        ))}
        <div className="mt-4 mx-3 pt-4 border-t border-gray-800">
          <a href="/admin/editor"
            className="block text-[11px] font-mono text-gray-700 hover:text-gray-500 transition-colors py-1">
            ← エディタへ
          </a>
          <a href="/"
            className="block text-[11px] font-mono text-gray-700 hover:text-gray-500 transition-colors py-1">
            ← サイトへ
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-[#080c10]">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${TYPE_COLORS[activeType].split(" ")[0]}`}>
              {({ anomaly: "⚠", module: "⬡", incident: "⚡", facility: "◼", personnel: "◉" } as Record<EntityType, string>)[activeType]}
            </span>
            <h1 className="font-mono text-sm text-gray-200">{TYPE_LABELS[activeType]}管理</h1>
            <span className="text-[11px] font-mono text-gray-600">({entities.length}件)</span>
          </div>
          <button onClick={openNew}
            className="text-[11px] font-mono px-3 py-1.5 rounded border border-amber-800/60
              text-amber-500 hover:bg-amber-900/20 transition-all">
            + 新規作成
          </button>
        </div>

        {/* Entity list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-gray-700 font-mono text-sm animate-pulse">読み込み中...</span>
            </div>
          ) : entities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-gray-700 font-mono text-sm">エンティティがありません</p>
              <button onClick={openNew}
                className="text-[11px] font-mono px-3 py-1.5 rounded border border-dashed border-gray-700
                  text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-all">
                + 最初のエンティティを作成
              </button>
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-800 text-gray-600">
                  <th className="text-left px-5 py-3 font-normal">ID</th>
                  <th className="text-left px-3 py-3 font-normal">名称</th>
                  <th className="text-left px-3 py-3 font-normal hidden sm:table-cell">分類/状態</th>
                  <th className="px-3 py-3 font-normal w-24"></th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity) => {
                  const id = entity.id as string;
                  const name = (entity.name as string) || "—";
                  const sub = (entity.classification || entity.type || entity.severity || entity.rank || "") as string;
                  const status = (entity.status || "") as string;
                  return (
                    <tr key={id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                      <td className={`px-5 py-4 ${TYPE_COLORS[activeType].split(" ")[0]}`}>{id}</td>
                      <td className="px-3 py-4 text-gray-300">{name}</td>
                      <td className="px-3 py-4 text-gray-600 hidden sm:table-cell">
                        {sub && <span className="mr-2">{sub}</span>}
                        {status && <span className="text-gray-700">{status}</span>}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openEdit(entity as Record<string, unknown>)}
                            className="text-gray-500 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-800/60 text-xs font-mono">編集</button>
                          <DeleteButton onConfirm={() => handleDelete(id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg bg-[#0d1117] border-l border-gray-700 shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
              <h2 className="font-mono text-sm text-gray-200">
                {editingId ? `編集: ${editingId}` : `新規${TYPE_LABELS[activeType]}`}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-400">✕</button>
            </div>

            {/* Form fields */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-mono text-gray-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-amber-600 ml-1">*</span>}
                  </label>
                  {field.options ? (
                    <select className={selectCls} value={formData[field.key] || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}>
                      <option value="">— 選択 —</option>
                      {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === "textarea" || field.type === "json" ? (
                    <textarea
                      className={inputCls + " resize-y min-h-[80px]"}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.type === "json" ? '{"key": "value"}' : ""}
                    />
                  ) : (
                    <input
                      className={inputCls}
                      type={field.type === "number" ? "number" : "text"}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                      readOnly={!!editingId && field.key === "id"}
                    />
                  )}
                  {field.type === "tags" && (
                    <p className="text-[10px] text-gray-700 font-mono mt-0.5">カンマ(,)で区切って複数入力</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-3 border-t border-gray-800 flex items-center justify-between">
              {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 rounded border border-gray-700 text-xs font-mono text-gray-500 hover:text-gray-300 transition-all">
                  キャンセル
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-1.5 rounded border border-amber-700/60 text-xs font-mono text-amber-400 hover:bg-amber-900/20 transition-all disabled:opacity-50">
                  {saving ? "保存中…" : editingId ? "更新" : "作成"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
