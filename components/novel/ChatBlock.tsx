"use client";

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

export function ChatBlock({ messages }: ChatBlockProps) {
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
    <div className="my-6 bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
      {/* App header */}
      <div className="bg-teal-900/60 border-b border-teal-800/40 px-4 py-2.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-teal-300 text-xs font-mono tracking-wider">財団セキュア通信</span>
        <span className="ml-auto text-teal-600 text-[10px] font-mono">E2E-ENCRYPTED</span>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 bg-[#0a0f14]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.side === "right" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                ${msg.side === "right" ? "bg-teal-700 text-teal-100" : speakerColors[msg.name] || LEFT_COLORS[0]}`}
            >
              {msg.name.charAt(0)}
            </div>

            <div className={`flex flex-col gap-0.5 max-w-[70%] ${msg.side === "right" ? "items-end" : "items-start"}`}>
              <span className="text-gray-500 text-[10px] font-mono px-1">{msg.name}</span>

              {/* Bubble */}
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${msg.side === "right"
                    ? "bg-teal-600/80 text-white rounded-br-sm"
                    : "bg-gray-700/80 text-gray-100 rounded-bl-sm"
                  }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
