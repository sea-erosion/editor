import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ===== ENTITIES =====

export const anomalies = sqliteTable("anomalies", {
  id: text("id").primaryKey(), // e.g. "SCP-1729"
  name: text("name").notNull(),
  classification: text("classification").notNull(), // Safe / Euclid / Keter / Thaumiel / etc.
  containmentClass: text("containment_class"),
  riskClass: text("risk_class"),
  disruptionClass: text("disruption_class"),
  description: text("description").notNull(),
  containmentProcedures: text("containment_procedures"),
  addendum: text("addendum"),
  tags: text("tags"), // JSON array
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(), // e.g. "MOD-004"
  name: text("name").notNull(),
  type: text("type").notNull(), // Equipment / Protocol / System / etc.
  status: text("status").notNull(), // Active / Deprecated / Classified
  description: text("description").notNull(),
  specifications: text("specifications"),
  relatedAnomalies: text("related_anomalies"), // JSON array of anomaly IDs
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(), // e.g. "INC-2024-0311"
  name: text("name").notNull(),
  severity: text("severity").notNull(), // Minor / Moderate / Major / Critical / Catastrophic
  status: text("status").notNull(), // Resolved / Ongoing / Under Investigation
  date: text("date").notNull(),
  location: text("location"),
  description: text("description").notNull(),
  casualties: text("casualties"),
  relatedAnomalies: text("related_anomalies"), // JSON array
  relatedPersonnel: text("related_personnel"), // JSON array
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const facilities = sqliteTable("facilities", {
  id: text("id").primaryKey(), // e.g. "SITE-19"
  name: text("name").notNull(),
  type: text("type").notNull(), // Research / Containment / Administrative / etc.
  location: text("location").notNull(),
  status: text("status").notNull(), // Active / Decommissioned / Compromised
  description: text("description").notNull(),
  director: text("director"),
  capacity: integer("capacity"),
  containedAnomalies: text("contained_anomalies"), // JSON array
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const personnel = sqliteTable("personnel", {
  id: text("id").primaryKey(), // e.g. "PRSN-0077"
  name: text("name").notNull(),
  codename: text("codename"),
  rank: text("rank").notNull(), // D-Class / Researcher / Agent / Director / etc.
  clearance: integer("clearance").notNull(), // 1-5
  status: text("status").notNull(), // Active / Deceased / Missing / KIA / Reassigned
  description: text("description").notNull(),
  specialties: text("specialties"), // JSON array
  assignedFacility: text("assigned_facility"),
  relatedAnomalies: text("related_anomalies"), // JSON array
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ===== NOVELS =====

export const novels = sqliteTable("novels", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull(),
  summary: text("summary"),
  classification: text("classification"), // Narrative / Report / Interview / Log
  clearanceRequired: integer("clearance_required").default(0),
  status: text("status").notNull().default("published"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ===== REACTIONS (2026-05-05) =====
// 章ごとの絵文字リアクション＋テキスト感想
export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey(),
  novelId: text("novel_id").notNull().references(() => novels.id, { onDelete: "cascade" }),
  chapterId: text("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),         // e.g. "❤️"
  comment: text("comment"),               // 任意テキスト感想（最大200字）
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  novelId: text("novel_id").notNull().references(() => novels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  content: text("content").notNull(), // Markup text with special tags
  status: text("status").notNull().default("published"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
