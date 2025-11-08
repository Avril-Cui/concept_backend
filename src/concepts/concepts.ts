// This file is MANUALLY MAINTAINED due to custom concept file naming.
// DO NOT RUN `deno task build` as it will overwrite this file!
// The auto-generator expects {ConceptName}Concept.ts but we use {ConceptName}.ts

import { SyncConcept } from "@engine";
import { Db, MongoClient } from "npm:mongodb";

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

// Database and client will be initialized by initializeConcepts()
export let db: Db;
export let client: MongoClient;

// Concept instances - initialized by initializeConcepts()
export let Auth: ReturnType<typeof Engine.instrumentConcept>;
export let TaskCatalog: ReturnType<typeof Engine.instrumentConcept>;
export let ScheduleTime: ReturnType<typeof Engine.instrumentConcept>;
export let RoutineLog: ReturnType<typeof Engine.instrumentConcept>;
export let AdaptiveSchedule: ReturnType<typeof Engine.instrumentConcept>;
export let Requesting: ReturnType<typeof Engine.instrumentConcept>;

// Initialize all concepts with database connection
export async function initializeConcepts() {
  const [dbInstance, clientInstance] = await getDb();
  db = dbInstance;
  client = clientInstance;

  Auth = Engine.instrumentConcept(new AuthConcept(db));
  TaskCatalog = Engine.instrumentConcept(new TaskCatalogConcept(db));
  ScheduleTime = Engine.instrumentConcept(new ScheduleTimeConcept(db));
  RoutineLog = Engine.instrumentConcept(new RoutineLogConcept(db));
  AdaptiveSchedule = Engine.instrumentConcept(new AdaptiveScheduleConcept(db));
  Requesting = Engine.instrumentConcept(new RequestingConcept(db));
}
