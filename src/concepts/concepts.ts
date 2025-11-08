// ⚠️ ⚠️ ⚠️ WARNING: DO NOT AUTO-GENERATE THIS FILE! ⚠️ ⚠️ ⚠️
// This file is MANUALLY MAINTAINED with custom initialization logic.
// DO NOT RUN `deno task build` - it will break the deployment!
// The auto-generator doesn't understand our async init() pattern.
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

import { SyncConcept } from "@engine";
import type { Db, MongoClient } from "npm:mongodb";

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

// Database and client - will be initialized by init()
export let db: Db = null as any;
export let client: MongoClient = null as any;

// Concept instances - will be initialized by init()
export let Auth: any = null as any;
export let TaskCatalog: any = null as any;
export let ScheduleTime: any = null as any;
export let RoutineLog: any = null as any;
export let AdaptiveSchedule: any = null as any;
export let Requesting: any = null as any;

// Initialization flag
let initialized = false;

// Initialize all concepts - MUST be called before using any concepts
export async function init() {
  if (initialized) {
    console.log("⚠️ Concepts already initialized, skipping...");
    return;
  }

  try {
    console.log("🔄 Initializing database connection...");
    const [dbInstance, clientInstance] = await getDb();
    db = dbInstance;
    client = clientInstance;
    console.log("✅ Database connection successful");

    console.log("🔄 Initializing concepts...");
    Auth = Engine.instrumentConcept(new AuthConcept(db));
    TaskCatalog = Engine.instrumentConcept(new TaskCatalogConcept(db));
    ScheduleTime = Engine.instrumentConcept(new ScheduleTimeConcept(db));
    RoutineLog = Engine.instrumentConcept(new RoutineLogConcept(db));

    console.log("🔄 Initializing AdaptiveSchedule concept...");
    const adaptiveScheduleInstance = new AdaptiveScheduleConcept(db);
    AdaptiveSchedule = Engine.instrumentConcept(adaptiveScheduleInstance);
    console.log("✅ AdaptiveSchedule initialized successfully");

    Requesting = Engine.instrumentConcept(new RequestingConcept(db));

    initialized = true;
    console.log("✅ All concepts initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize concepts:", error);
    console.error("Environment variables check:");
    console.error("  MONGODB_URL:", Deno.env.get("MONGODB_URL") ? "✓ Set" : "✗ Not set");
    console.error("  DB_NAME:", Deno.env.get("DB_NAME") ? "✓ Set" : "✗ Not set");
    console.error("  GEMINI_API_KEY:", Deno.env.get("GEMINI_API_KEY") ? "✓ Set" : "✗ Not set");
    throw new Error(`Concept initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
