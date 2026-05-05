"use client";

import { useEffect, useState } from "react";

const GLITCH_CHARS = "█▓▒░▄▀■□▪▫◆◇○●◎⬡⬢▲△▼▽";

function randomGlitch(text: string, intensity: number): string {
  return text
    .split("")
    .map((ch) =>
      Math.random() < intensity
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : ch
    )
    .join("");
}

interface GlitchTextProps {
  content: string;
}

export function GlitchText({ content }: GlitchTextProps) {
  const [display, setDisplay] = useState(content);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    // Periodic glitch bursts
    const burst = () => {
      setGlitching(true);
      let count = 0;
      const interval = setInterval(() => {
        setDisplay(randomGlitch(content, 0.3 - count * 0.05));
        count++;
        if (count >= 6) {
          clearInterval(interval);
          setDisplay(content);
          setGlitching(false);
        }
      }, 50);
    };

    const schedule = () => {
      const delay = 3000 + Math.random() * 7000;
      return setTimeout(() => {
        burst();
        timerId = schedule();
      }, delay);
    };

    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, [content]);

  return (
    <span
      className={`font-mono text-red-500/80 relative inline-block
        ${glitching ? "animate-pulse" : ""}`}
      style={{
        textShadow: glitching
          ? "2px 0 #ff000080, -2px 0 #00ffff40"
          : "none",
        filter: glitching ? "blur(0.5px)" : "none",
        transition: "filter 0.1s, text-shadow 0.1s",
      }}
    >
      {display}
    </span>
  );
}
