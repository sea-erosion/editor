// 編集日時: 2026-05-05
"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  side: "left" | "right";
  name: string;
  text: string;
}

interface ChatBlockProps {
  messages: ChatMessage[];
}

const LEFT_COLORS = [
  "bg-gray-700 text-gray-100",
  "bg-slate-700 text-slate-100",
  "bg-zinc-700 text-zinc-100",
];

// メッセージ1件ごとの表示遅延（ms）
const MSG_DELAY = 120;
// 最初のメッセージが現れるまでの遅延
const INITIAL_DELAY = 200;

export function ChatBlock({ messages }: ChatBlockProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  // IntersectionObserver でビューポート内に入ったら順次表示
  useEffect(() => {
    if (messages.length === 0) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          observer.disconnect();
          messages.forEach((_, i) => {
            setTimeout(
              () => setVisibleCount((c) => Math.max(c, i + 1)),
              INITIAL_DELAY + i * MSG_DELAY
            );
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages]);

  // Assign consistent colors to speakers
  const speakerColors: Record<string, string> = {};
  let colorIdx = 0;
  for (const msg of messages) {
    if (msg.side === "left" && !speakerColors[msg.name]) {
      speakerColors[msg.name] = LEFT_COLORS[colorIdx % LEFT_COLORS.length];
      colorIdx++;
    }
  }

  return (
    <div className="my-6 bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden" ref={containerRef}>
      {/* App header */}
      <div className="bg-teal-900/60 border-b border-teal-800/40 px-4 py-2.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-teal-300 text-xs font-mono tracking-wider">財団セキュア通信</span>
        <span className="ml-auto text-teal-600 text-[10px] font-mono">E2E-ENCRYPTED</span>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 bg-[#0a0f14]">
        {messages.map((msg, i) => {
          const visible = i < visibleCount;
          const isRight = msg.side === "right";
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${isRight ? "flex-row-reverse" : ""}`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible
                  ? "translateX(0)"
                  : isRight
                  ? "translateX(18px)"
                  : "translateX(-18px)",
                transition: "opacity 0.28s ease-out, transform 0.28s ease-out",
              }}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${isRight ? "bg-teal-700 text-teal-100" : speakerColors[msg.name] || LEFT_COLORS[0]}`}
                style={{
                  transform: visible ? "scale(1)" : "scale(0.6)",
                  transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  transitionDelay: visible ? "0.08s" : "0s",
                }}
              >
                {msg.name.charAt(0)}
              </div>

              <div className={`flex flex-col gap-0.5 max-w-[70%] ${isRight ? "items-end" : "items-start"}`}>
                <span className="text-gray-500 text-[10px] font-mono px-1">{msg.name}</span>

                {/* Bubble */}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${isRight
                      ? "bg-teal-600/80 text-white rounded-br-sm"
                      : "bg-gray-700/80 text-gray-100 rounded-bl-sm"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* 未表示メッセージがあるときの入力中インジケーター */}
        {visibleCount < messages.length && visibleCount > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((j) => (
                  <span
                    key={j}
                    className="w-1 h-1 rounded-full bg-gray-400"
                    style={{
                      animation: "nml-typing-dot 1s ease-in-out infinite",
                      animationDelay: `${j * 0.18}s`,
                    }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
