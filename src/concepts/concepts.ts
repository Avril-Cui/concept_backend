// This file is MANUALLY MAINTAINED due to custom concept file naming.
// DO NOT RUN `deno task build` as it will overwrite this file!
// The auto-generator expects {ConceptName}Concept.ts but we use {ConceptName}.ts

import { SyncConcept } from "@engine";

export const Engine = new SyncConcept();

import { getDb } from "@utils/database.ts";

import AuthConcept from "./Auth/Auth.ts";
import TaskCatalogConcept from "./TaskCatalog/TaskCatalog.ts";
import ScheduleTimeConcept from "./ScheduleTime/ScheduleTime.ts";
import RoutineLogConcept from "./RoutineLog/RoutineLog.ts";
import AdaptiveScheduleConcept from "./AdaptiveSchedule/AdaptiveSchedule.ts";
import RequestingConcept from "./Requesting/RequestingConcept.ts";

export type { default as AuthConcept } from "./Auth/Auth.ts";
export type { default as TaskCatalogConcept } from "./TaskCatalog/TaskCatalog.ts";
export type { default as ScheduleTimeConcept } from "./ScheduleTime/ScheduleTime.ts";
export type { default as RoutineLogConcept } from "./RoutineLog/RoutineLog.ts";
export type { default as AdaptiveScheduleConcept } from "./AdaptiveSchedule/AdaptiveSchedule.ts";
export type { default as RequestingConcept } from "./Requesting/RequestingConcept.ts";

// Initialize the database connection with better error handling
let dbInitialization;
try {
  console.log("🔄 Initializing database connection...");
  dbInitialization = await getDb();
  console.log("✅ Database connection successful");
} catch (error) {
  console.error("❌ Failed to initialize database:", error);
  console.error("Environment variables check:");
  console.error("  MONGODB_URL:", Deno.env.get("MONGODB_URL") ? "✓ Set" : "✗ Not set");
  console.error("  DB_NAME:", Deno.env.get("DB_NAME") ? "✓ Set" : "✗ Not set");
  throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
}

export const [db, client] = dbInitialization;

// Initialize concepts with error handling
let adaptiveScheduleInstance;
try {
  console.log("🔄 Initializing AdaptiveSchedule concept...");
  adaptiveScheduleInstance = new AdaptiveScheduleConcept(db);
  console.log("✅ AdaptiveSchedule initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize AdaptiveSchedule:", error);
  console.error("  GEMINI_API_KEY:", Deno.env.get("GEMINI_API_KEY") ? "✓ Set" : "✗ Not set");
  throw new Error(`AdaptiveSchedule initialization failed: ${error instanceof Error ? error.message : String(error)}`);
}

export const Auth = Engine.instrumentConcept(new AuthConcept(db));
export const TaskCatalog = Engine.instrumentConcept(new TaskCatalogConcept(db));
export const ScheduleTime = Engine.instrumentConcept(new ScheduleTimeConcept(db));
export const RoutineLog = Engine.instrumentConcept(new RoutineLogConcept(db));
export const AdaptiveSchedule = Engine.instrumentConcept(adaptiveScheduleInstance);
export const Requesting = Engine.instrumentConcept(new RequestingConcept(db));
