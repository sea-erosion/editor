// 編集日時: 2026-05-03

type WarnLevel = "danger" | "info" | "caution";

interface WarnBannerProps {
  level: WarnLevel;
  title?: string;
  content: string;
}

const STYLES: Record<WarnLevel, { border: string; bg: string; icon: string; iconColor: string; titleColor: string; textColor: string }> = {
  danger:  { border: "border-red-800/60",    bg: "bg-red-950/30",    icon: "⚠",  iconColor: "text-red-500",    titleColor: "text-red-400",    textColor: "text-red-300/80"   },
  caution: { border: "border-yellow-800/50", bg: "bg-yellow-950/20", icon: "！",  iconColor: "text-yellow-500", titleColor: "text-yellow-400", textColor: "text-yellow-200/70"},
  info:    { border: "border-gray-700/50",   bg: "bg-gray-800/30",   icon: "ℹ",  iconColor: "text-gray-500",   titleColor: "text-gray-400",   textColor: "text-gray-400/80"  },
};

export function WarnBanner({ level, title, content }: WarnBannerProps) {
  const s = STYLES[level];
  return (
    <div
      className={`my-4 flex gap-3 px-4 py-3 border rounded-md ${s.border} ${s.bg} ${
        level === "danger" ? "nml-warn-danger" : ""
      }`}
    >
      <span className={`flex-shrink-0 text-sm mt-0.5 font-mono ${s.iconColor}`}>{s.icon}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-[11px] font-mono tracking-widest mb-1 ${s.titleColor}`}>{title}</p>
        )}
        <p className={`text-sm leading-relaxed font-serif ${s.textColor}`}>{content}</p>
      </div>
    </div>
  );
}
