/**
 * Entry point for an application built with concepts + synchronizations.
 * Requires the Requesting concept as a bootstrap concept.
 * Please run "deno run import" or "generate_imports.ts" to prepare "@concepts".
 */
import * as concepts from "@concepts";

// Use the following line instead to run against the test database, which resets each time.
// import * as concepts from "@test-concepts";

const { Engine } = concepts;
import { Logging } from "@engine";
import { startRequestingServer } from "@concepts/Requesting/RequestingConcept.ts";
import syncs from "@syncs";

// Verify exports are available
console.log("📦 @concepts exports:", Object.keys(concepts).filter(k => !k.startsWith('_')));
console.log("🔍 AdaptiveSchedule exported:", 'AdaptiveSchedule' in concepts);

// Initialize database and all concepts before using them
await concepts.init();

// Verify exports are initialized
console.log("✅ AdaptiveSchedule initialized:", typeof concepts.AdaptiveSchedule === 'object' && concepts.AdaptiveSchedule !== null);

/**
 * Available logging levels:
 *   Logging.OFF
 *   Logging.TRACE - display a trace of the actions.
 *   Logging.VERBOSE - display full record of synchronization.
 */
Engine.logging = Logging.TRACE;

// Register synchronizations
Engine.register(syncs);

// Start a server to provide the Requesting concept with external/system actions.
startRequestingServer(concepts);
