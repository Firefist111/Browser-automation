import { StepNodeType } from "@/features/workflows/nodes/node-registry";
import { Edge } from "@xyflow/react";
import { pgTable, text, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";

export type WorkflowGraph = {
  nodes : StepNodeType[],
  edges : Edge[],
}

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph").$type<WorkflowGraph>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;