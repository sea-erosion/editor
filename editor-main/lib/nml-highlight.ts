// 編集日時: 2026-05-03

type Rule = { pattern: RegExp; cls: string };

const RULES: Rule[] = [
  // エンティティ
  { pattern: /\[ANOMALY\|[^\]]+\]/g,   cls: "hl-anomaly"  },
  { pattern: /\[MODULE\|[^\]]+\]/g,    cls: "hl-module"   },
  { pattern: /\[INCIDENT\|[^\]]+\]/g,  cls: "hl-incident" },
  { pattern: /\[FACILITY\|[^\]]+\]/g,  cls: "hl-facility" },
  { pattern: /\[PERSON\|[^\]]+\]/g,    cls: "hl-person"   },
  // ブロック開閉
  { pattern: /\[HEADER\]|\[\/HEADER\]/g,                          cls: "hl-header"    },
  { pattern: /\[REDACTED_BLOCK[^\]]*\]|\[\/REDACTED_BLOCK\]/g,    cls: "hl-redacted"  },
  { pattern: /\[GLITCH\]|\[\/GLITCH\]/g,                          cls: "hl-glitch"    },
  { pattern: /\[TERMINAL[^\]]*\]|\[\/TERMINAL\]/g,                cls: "hl-terminal"  },
  { pattern: /\[CHOICE\]|\[\/CHOICE\]/g,                          cls: "hl-choice"    },
  { pattern: /\[CHOICE3\]|\[\/CHOICE3\]/g,                        cls: "hl-choice3"   },
  { pattern: /\[CHAT\]|\[\/CHAT\]/g,                              cls: "hl-chat"      },
  { pattern: /\[MSG\|[^\]]+\]/g,                                  cls: "hl-msg"       },
  { pattern: /\[DIALOG\]|\[\/DIALOG\]/g,                          cls: "hl-dialog"    },
  { pattern: /\[LINE\|[^\]]+\]/g,                                 cls: "hl-line"      },
  { pattern: /\[GLOSSARY\]|\[\/GLOSSARY\]/g,                      cls: "hl-glossary"  },
  { pattern: /\[TERM\|[^\]]+\]/g,                                 cls: "hl-term"      },
  // 新規ブロック
  { pattern: /\[LOG[^\]]*\]|\[\/LOG\]/g,                         cls: "hl-log"       },
  { pattern: /\[CALL[^\]]*\]|\[\/CALL\]/g,                       cls: "hl-call"      },
  { pattern: /\[VOICE\|[^\]]+\]/g,                               cls: "hl-voice"     },
  { pattern: /\[FOOTNOTE\]|\[\/FOOTNOTE\]/g,                     cls: "hl-footnote"  },
  { pattern: /\[N\|\d+\|[^\]]+\]/g,                              cls: "hl-footnote"  },
  { pattern: /\[INTERVIEW[^\]]*\]|\[\/INTERVIEW\]/g,             cls: "hl-interview" },
  { pattern: /\[Q\|[^\]]+\]/g,                                   cls: "hl-interview" },
  { pattern: /\[A\|[^\]]+\]/g,                                   cls: "hl-interview" },
  { pattern: /\[CLEARANCE\|\d+\]|\[\/CLEARANCE\]/g,              cls: "hl-clearance" },
  { pattern: /\[WARN\|[^\]]+\]|\[\/WARN\]/g,                     cls: "hl-warn"      },
  { pattern: /\[IMAGE\|[^\]]+\]/g,                               cls: "hl-image"     },
  { pattern: /\[COUNTER\|[^\]]+\]/g,                             cls: "hl-counter"   },
  { pattern: /\[POV\|[^\]]+\]/g,                                 cls: "hl-pov"       },
  { pattern: /\[SYS\|[^\]]+\]/g,                                 cls: "hl-sys"       },
  { pattern: /\[HR[^\]]*\]/g,                                    cls: "hl-hr"        },
  // 新規ブロック (2026-05-03)
  { pattern: /\[REPORT[^\]]*\]|\[\/REPORT\]/g,                  cls: "hl-report"       },
  { pattern: /\[TIMELINE\]|\[\/TIMELINE\]/g,                     cls: "hl-timeline"     },
  { pattern: /\[EVENT\|[^\]]+\]/g,                               cls: "hl-timeline"     },
  { pattern: /\[CLASSIFIED[^\]]*\]|\[\/CLASSIFIED\]/g,          cls: "hl-classified"   },
  { pattern: /\[TABLE\]|\[\/TABLE\]/g,                           cls: "hl-table"        },
  { pattern: /\[ROW\][^\[]*/g,                                    cls: "hl-table"        },
  { pattern: /\[TRANSMISSION[^\]]*\]|\[\/TRANSMISSION\]/g,      cls: "hl-transmission" },
  // インライン
  { pattern: /\[RUBY\|[^\]]+\]/g,                                cls: "hl-ruby"      },
  { pattern: /\[DOT\|[^\]]+\]/g,                                 cls: "hl-dot"       },
  { pattern: /\[EM\|[^\]]+\]/g,                                  cls: "hl-em"        },
  { pattern: /\[STRONG\|[^\]]+\]/g,                              cls: "hl-strong"    },
  { pattern: /\[CORRUPT[^\]]*\]/g,                               cls: "hl-corrupt"   },
  { pattern: /\[NOTE\|\d+\]/g,                                   cls: "hl-note-ref"  },
  { pattern: /\[TIME\|[^\]]+\]/g,                                cls: "hl-timestamp" },
  { pattern: /\[FONT\|[^\]]+\]/g,                                 cls: "hl-font"      },
  { pattern: /\[COLOR\|[^\]]+\]/g,                                cls: "hl-color"     },
  { pattern: /\[BLINK\|[^\]]+\]/g,                                cls: "hl-blink"     },
  { pattern: /\[SPOILER\|[^\]]+\]/g,                              cls: "hl-spoiler"   },
  { pattern: /\[MARK\|[^\]]+\]/g,                                 cls: "hl-mark"      },
  { pattern: /\[SHAKE\|[^\]]+\]/g,                                cls: "hl-shake"     },
  { pattern: /\[LINK\|[^\]]+\]/g,                                 cls: "hl-link"      },
];

function escapeHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export function buildHighlightedHTML(source: string): string {
  type Span = { start: number; end: number; cls: string };
  const spans: Span[] = [];
  for (const { pattern, cls } of RULES) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(source)) !== null)
      spans.push({ start: m.index, end: m.index + m[0].length, cls });
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered: Span[] = []; let cursor = 0;
  for (const s of spans) { if (s.start >= cursor) { filtered.push(s); cursor = s.end; } }
  let html = "", pos = 0;
  for (const s of filtered) {
    if (s.start > pos) html += escapeHtml(source.slice(pos, s.start));
    html += `<mark class="${s.cls}">${escapeHtml(source.slice(s.start, s.end))}</mark>`;
    pos = s.end;
  }
  if (pos < source.length) html += escapeHtml(source.slice(pos));
  return html;
}
