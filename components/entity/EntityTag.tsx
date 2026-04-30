"use client";

import { EntityType } from "@/types";
import { useRef, useState } from "react";
import { EntityPopup } from "./EntityPopup";

interface EntityTagProps {
  entityType: EntityType;
  entityId: string;
  label: string;
}

const TAG_STYLES: Record<EntityType, string> = {
  anomaly:   "text-amber-400 border-amber-700 hover:bg-amber-900/30",
  module:    "text-cyan-400 border-cyan-700 hover:bg-cyan-900/30",
  incident:  "text-red-400 border-red-700 hover:bg-red-900/30",
  facility:  "text-green-400 border-green-700 hover:bg-green-900/30",
  personnel: "text-violet-400 border-violet-700 hover:bg-violet-900/30",
};

const TAG_ICONS: Record<EntityType, string> = {
  anomaly:   "⚠",
  module:    "⬡",
  incident:  "⚡",
  facility:  "◼",
  personnel: "◉",
};

export function EntityTag({ entityType, entityId, label }: EntityTagProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const style = TAG_STYLES[entityType];

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-0.5 text-[0.875em] px-1 py-0.5 rounded
          border transition-all duration-100 font-sans cursor-pointer
          ${style} ${open ? "ring-1 ring-white/20" : ""}`}
      >
        <span className="text-[0.75em] opacity-70">{TAG_ICONS[entityType]}</span>
        {label}
      </button>
      {open && (
        <EntityPopup
          entityType={entityType}
          entityId={entityId}
          label={label}
          anchorRef={ref}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
