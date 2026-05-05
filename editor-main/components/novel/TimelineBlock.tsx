// 編集日時: 2026-05-03
"use client";

import { useEffect, useRef, useState } from "react";

interface TimelineEvent {
  time: string;
  text: string;
}

interface TimelineBlockProps {
  events: TimelineEvent[];
}

export function TimelineBlock({ events }: TimelineBlockProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (events.length === 0) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          observer.disconnect();
          // 各イベントを50msずつ遅らせて表示
          events.forEach((_, i) => {
            setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), i * 80);
          });
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="my-6 pl-2" ref={containerRef}>
      <div className="text-[9px] font-mono text-gray-600 tracking-[0.2em] uppercase mb-3 pl-8">
        ◼ INCIDENT TIMELINE
      </div>
      <div className="relative">
        {/* 縦線 */}
        <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gray-700/50" aria-hidden />

        <div className="space-y-0">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex items-start gap-0 group"
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? "translateX(0)" : "translateX(-6px)",
                transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
              }}
            >
              {/* 時刻 */}
              <div className="w-20 shrink-0 text-right pr-3 pt-[0.35rem]">
                <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-400 transition-colors leading-tight">
                  {ev.time}
                </span>
              </div>

              {/* ドット */}
              <div className="relative shrink-0 w-4 pt-[0.45rem]">
                <div
                  className="w-2 h-2 rounded-full border border-gray-600 bg-gray-800 group-hover:border-gray-400 group-hover:bg-gray-600 transition-all mx-auto"
                  style={{
                    transform: i < visibleCount ? "scale(1)" : "scale(0)",
                    transition: "transform 0.25s ease-out",
                    transitionDelay: `${i * 80 + 100}ms`,
                  }}
                />
              </div>

              {/* テキスト */}
              <div className="flex-1 pl-3 pb-4 pt-[0.2rem]">
                <p className="text-sm text-gray-300 leading-relaxed font-serif group-hover:text-gray-200 transition-colors">
                  {ev.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
