// 編集日時: 2026-05-03 (fix: インライントークンを段落内に埋め込む / add: REPORT, TIMELINE, CLASSIFIED, TABLE, TRANSMISSION, FONT, COLOR, BLINK, SPOILER, MARK, SHAKE, LINK) / 2026-05-07 (fix: BUG-7 未使用のBLOCK_INLINE_TYPES削除)
"use client";

import { CallBlock }          from "@/components/novel/CallBlock";
import { ChatBlock }          from "@/components/novel/ChatBlock";
import { Choice3Block }       from "@/components/novel/Choice3Block";
import { ChoiceBlock }        from "@/components/novel/ChoiceBlock";
import { ClearanceGate }      from "@/components/novel/ClearanceGate";
import { CorruptText }        from "@/components/novel/CorruptText";
import { DialogBlock }        from "@/components/novel/DialogBlock";
import { DotText }            from "@/components/novel/DotText";
import { FootnoteBlock, NoteRef } from "@/components/novel/Footnote";
import { GlitchText }         from "@/components/novel/GlitchText";
import { GlossaryBlock }      from "@/components/novel/GlossaryBlock";
import { HrDivider }          from "@/components/novel/HrDivider";
import { EmText, StrongText, ColorText, BlinkText, SpoilerText, MarkText, ShakeText, LinkText } from "@/components/novel/InlineDecorations";
import { InterviewBlock }     from "@/components/novel/InterviewBlock";
import { LogBlock }           from "@/components/novel/LogBlock";
import { SysLogLine }         from "@/components/novel/SysLogLine";
import { TerminalBlock }      from "@/components/novel/TerminalBlock";
import { WarnBanner }         from "@/components/novel/WarnBanner";
import { CounterBadge, ImagePlaceholder, PovMarker, TimeStamp } from "@/components/novel/StatusWidgets";
import { ReportBlock }       from "@/components/novel/ReportBlock";
import { TimelineBlock }     from "@/components/novel/TimelineBlock";
import { ClassifiedBlock }   from "@/components/novel/ClassifiedBlock";
import { TableBlock }        from "@/components/novel/TableBlock";
import { TransmissionBlock } from "@/components/novel/TransmissionBlock";
import { FontText }          from "@/components/novel/FontText";
import {
  parseChatMessages, parseChoice3Options, parseChoiceOptions,
  parseDialogLines, parseFootnoteItems, parseGlossaryTerms,
  parseInterviewLines, parseNovelMarkup, parseVoiceLines,
  parseTimelineEvents, parseTableRows,
} from "@/lib/markup-parser";
import { EntityType, Token } from "@/types";
import React, { useMemo, useState } from "react";
import { EntityTag } from "../entity/EntityTag";

interface NovelRendererProps { content: string; }

function RedactedBlock({ content, level }: { content: string; level?: number }) {
  const [show, setShow] = useState(false);
  const locked = (level ?? 0) >= 3;
  return (
    <div className="my-4 p-3 border border-gray-700 rounded bg-gray-800/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest">
          ██ 機密情報{(level ?? 0) > 0 ? ` [CLR-Lv.${level}]` : ""}
        </span>
        {!locked
          ? <button onClick={() => setShow(v=>!v)} className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors">[{show?"非表示":"表示"}]</button>
          : <span className="text-[10px] font-mono text-red-800">[クリアランス不足 — 解除不可]</span>}
      </div>
      <p className={`text-gray-300 text-sm leading-relaxed font-mono ${!show?"select-none":""}`}>
        {show && !locked ? content : content.replace(/[^\n]/g,"█")}
      </p>
    </div>
  );
}

const ENTITY_TOKEN_TYPES: Record<string, EntityType> = {
  anomaly_tag:"anomaly", module_tag:"module", incident_tag:"incident",
  facility_tag:"facility", personnel_tag:"personnel",
};

// インライントークンを React ノードに変換
function renderInlineToken(token: Token, key: number): React.ReactNode {
  if (token.type in ENTITY_TOKEN_TYPES)
    return <EntityTag key={key} entityType={ENTITY_TOKEN_TYPES[token.type]} entityId={token.entityId!} label={token.label!} />;
  switch (token.type) {
    case "ruby":    return <ruby key={key} className="mx-0.5"><span className="text-gray-200">{token.content}</span><rt className="text-gray-400 text-[0.6em]">{token.label}</rt></ruby>;
    case "dot":     return <DotText key={key} content={token.content} />;
    case "em":      return <EmText key={key} content={token.content} />;
    case "strong":  return <StrongText key={key} content={token.content} />;
    case "corrupt": { const lv = token.meta?.level ? parseInt(token.meta.level,10) : 1; return <CorruptText key={key} content={token.content} level={lv} />; }
    case "note_ref": return <NoteRef key={key} num={parseInt(token.content,10)} />;
    case "timestamp": return <TimeStamp key={key} time={token.content} />;
    case "font":      return <FontText key={key} fontKey={token.label!} content={token.content} />;
    case "color":     return <ColorText key={key} color={token.label!} content={token.content} />;
    case "blink":     return <BlinkText key={key} content={token.content} />;
    case "spoiler":   return <SpoilerText key={key} content={token.content} />;
    case "mark":      return <MarkText key={key} content={token.content} />;
    case "shake":     return <ShakeText key={key} content={token.content} />;
    case "link":      return <LinkText key={key} href={token.label!} content={token.content} />;
    default: return <React.Fragment key={key}>{token.content}</React.Fragment>;
  }
}

// テキスト文字列をインライントークンと混在したまま段落ノードに変換する
// (インライントークンはテキストセグメントとして混在可能)
type ParagraphChild = string | React.ReactNode;

function renderMixedText(segments: ParagraphChild[], startKey: number): { nodes: React.ReactNode[]; nextKey: number } {
  const nodes: React.ReactNode[] = [];
  let key = startKey;
  for (const seg of segments) {
    if (typeof seg === "string") {
      // 段落分割(\n\n)とソフト改行(\n)を処理
      const paras = seg.split(/\n\n+/);
      paras.forEach((para, pi) => {
        if (!para.trim()) return;
        const lines = para.split("\n");
        const lineNodes: React.ReactNode[] = [];
        lines.forEach((line, li) => {
          lineNodes.push(line);
          if (li < lines.length - 1) lineNodes.push(<br key={`br-${key++}-${pi}-${li}`} />);
        });
        nodes.push(<p key={key++} className="my-4 leading-[1.9] text-gray-200">{lineNodes}</p>);
      });
    } else {
      nodes.push(seg);
    }
  }
  return { nodes, nextKey: key };
}

const INLINE_TYPES = new Set([
  "ruby","dot","em","strong","corrupt","note_ref","timestamp","font","color","blink","spoiler","mark","shake","link",
  ...Object.keys(ENTITY_TOKEN_TYPES),
]);

export function NovelRenderer({ content }: NovelRendererProps) {
  const tokens = useMemo(() => parseNovelMarkup(content), [content]);
  const elements: React.ReactNode[] = [];
  // 段落に蓄積するセグメント（文字列 or インライン React ノード）
  let paraSegments: ParagraphChild[] = [];
  let key = 0;
  // 連続する sys トークンに対して index を払い出すカウンター (2026-05-05)
  let sysGroupIdx = 0;
  let lastTokenWasSys = false;

  const flushPara = () => {
    if (paraSegments.length === 0) return;
    // 空文字列のみなら捨てる
    const hasContent = paraSegments.some(s => typeof s !== "string" || s.trim());
    if (hasContent) {
      const { nodes, nextKey } = renderMixedText(paraSegments, key);
      key = nextKey;
      if (nodes.length > 0) elements.push(...nodes);
    }
    paraSegments = [];
  };

  for (const token of tokens) {
    if (token.type === "text") {
      paraSegments.push(token.content);
      continue;
    }

    // インライントークンは段落バッファに React ノードとして追加する
    if (INLINE_TYPES.has(token.type)) {
      paraSegments.push(renderInlineToken(token, key++));
      continue;
    }

    // ブロックトークン → まず段落をフラッシュしてからブロックを追加
    flushPara();
    // sys 連続グループの追跡リセット（sys 以外が来たらグループを切る）
    if (token.type !== "sys") lastTokenWasSys = false;

    switch (token.type) {
      case "header":
        elements.push(<div key={key++} className="my-6 border border-gray-600/70 rounded px-4 py-2 bg-gray-800/40"><p className="text-center text-[11px] font-mono text-gray-400 tracking-widest uppercase">{token.content}</p></div>);
        break;
      case "redacted": { const lv = token.meta?.level ? parseInt(token.meta.level,10) : 0; elements.push(<RedactedBlock key={key++} content={token.content} level={lv}/>); break; }
      case "glitch":   elements.push(<div key={key++} className="my-3 font-mono text-sm"><GlitchText content={token.content}/></div>); break;
      case "terminal": elements.push(<TerminalBlock key={key++} content={token.content} prompt={token.meta?.prompt}/>); break;
      case "choice":   elements.push(<ChoiceBlock key={key++} options={parseChoiceOptions(token.content)}/>); break;
      case "choice3":  elements.push(<Choice3Block key={key++} options={parseChoice3Options(token.content)}/>); break;
      case "chat":     elements.push(<ChatBlock key={key++} messages={parseChatMessages(token.content)}/>); break;
      case "dialog":   elements.push(<DialogBlock key={key++} lines={parseDialogLines(token.content)}/>); break;
      case "glossary": elements.push(<GlossaryBlock key={key++} terms={parseGlossaryTerms(token.content)}/>); break;
      case "sys": {
        if (!lastTokenWasSys) sysGroupIdx = 0;
        elements.push(<SysLogLine key={key++} text={token.content} translation={token.label||undefined} index={sysGroupIdx++}/>);
        lastTokenWasSys = true;
        break;
      }
      case "hr":       elements.push(<HrDivider key={key++} style={token.content}/>); break;
      case "log":      elements.push(<LogBlock key={key++} title={token.label??""} date={token.meta?.date} content={token.content}/>); break;
      case "call":     elements.push(<CallBlock key={key++} header={token.label??""} lines={parseVoiceLines(token.content)}/>); break;
      case "footnote": elements.push(<FootnoteBlock key={key++} items={parseFootnoteItems(token.content)}/>); break;
      case "interview":elements.push(<InterviewBlock key={key++} header={token.label??""} lines={parseInterviewLines(token.content)}/>); break;
      case "clearance":{ const lv = parseInt(token.meta?.level??"1",10); elements.push(<ClearanceGate key={key++} level={lv} content={token.content}/>); break; }
      case "warn":     elements.push(<WarnBanner key={key++} level={(token.meta?.level??"info") as "danger"|"info"|"caution"} title={token.meta?.title||undefined} content={token.content}/>); break;
      case "image_placeholder": elements.push(<ImagePlaceholder key={key++} type={token.meta?.imgType??""} caption={token.content}/>); break;
      case "counter":  elements.push(<CounterBadge key={key++} label={token.label??""} value={token.content}/>); break;
      case "pov":      elements.push(<PovMarker key={key++} name={token.content}/>); break;
      case "report":   elements.push(<ReportBlock key={key++} classification={token.label ?? ""} date={token.meta?.date} content={token.content}/>); break;
      case "timeline": elements.push(<TimelineBlock key={key++} events={parseTimelineEvents(token.content)}/>); break;
      case "classified": elements.push(<ClassifiedBlock key={key++} reason={token.meta?.reason} content={token.content}/>); break;
      case "table":    elements.push(<TableBlock key={key++} rows={parseTableRows(token.content)}/>); break;
      case "transmission": elements.push(<TransmissionBlock key={key++} from={token.label ?? ""} to={token.meta?.to ?? ""} content={token.content}/>); break;
      default:         elements.push(<span key={key++} className="text-gray-300">{token.content}</span>);
    }
  }
  flushPara();
  return <div className="novel-content font-serif text-[1.05rem]">{elements}</div>;
}
