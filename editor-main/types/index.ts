// 編集日時: 2026-05-03
export type EntityType = "anomaly" | "module" | "incident" | "facility" | "personnel";

export interface Anomaly { id: string; name: string; classification: string; containmentClass?: string|null; riskClass?: string|null; disruptionClass?: string|null; description: string; containmentProcedures?: string|null; addendum?: string|null; tags?: string[]|null; imageUrl?: string|null; createdAt?: number|null; updatedAt?: number|null; }
export interface Module { id: string; name: string; type: string; status: string; description: string; specifications?: Record<string,string|number>|null; relatedAnomalies?: string[]|null; createdAt?: number|null; }
export interface Incident { id: string; name: string; severity: string; status: string; date: string; location?: string|null; description: string; casualties?: string|null; relatedAnomalies?: string[]|null; relatedPersonnel?: string[]|null; createdAt?: number|null; }
export interface Facility { id: string; name: string; type: string; location: string; status: string; description: string; director?: string|null; capacity?: number|null; containedAnomalies?: string[]|null; createdAt?: number|null; }
export interface Personnel { id: string; name: string; codename?: string|null; rank: string; clearance: number; status: string; description: string; specialties?: string[]|null; assignedFacility?: string|null; relatedAnomalies?: string[]|null; createdAt?: number|null; }
export interface Novel { id: string; title: string; slug: string; author: string; summary?: string|null; classification?: string|null; clearanceRequired?: number|null; status: string; createdAt?: number|null; updatedAt?: number|null; }
export interface Chapter { id: string; novelId: string; title: string; chapterNumber: number; content: string; status: string; createdAt?: number|null; }
export type AnyEntity = Anomaly | Module | Incident | Facility | Personnel;

export type TokenType =
  | "text"
  | "anomaly_tag" | "module_tag" | "incident_tag" | "facility_tag" | "personnel_tag"
  | "header" | "redacted" | "glitch" | "terminal"
  | "ruby" | "dot" | "em" | "strong" | "corrupt"
  | "sys" | "hr"
  | "choice" | "choice3"
  | "chat" | "chat_msg"
  | "dialog" | "dialog_line"
  | "glossary" | "glossary_term"
  | "log"
  | "call"
  | "footnote"
  | "note_ref"
  | "interview"
  | "clearance"
  | "warn"
  | "image_placeholder"
  | "counter"
  | "pov"
  | "timestamp"
  | "report"
  | "timeline"
  | "classified"
  | "table"
  | "transmission"
  | "font"
  | "color"
  | "blink"
  | "spoiler"
  | "mark"
  | "shake"
  | "link";

export interface Token {
  type: TokenType;
  content: string;
  entityId?: string;
  label?: string;
  meta?: Record<string, string>;
}
