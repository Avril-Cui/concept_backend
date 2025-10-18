[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-design-overview](../../background/concept-design-overview.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: AdaptiveSchedule

# response:

# concept: AdaptiveSchedule
![@AdaptiveSchedule](AdaptiveSchedule.md)

# Note
1. You should have a GeminiLLM class than handles LLM requests properly. This is an example (you can use it directly but make sure to adjust it so it works well with the concept implementation):
  ```typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';

  /**
   * Configuration for API access
   */
  export interface Config {
    apiKey: string;
    maxRetries?: number;
    timeoutMs?: number;
    initialBackoffMs?: number;
  }

  export class GeminiLLM {
    private apiKey: string;
    private maxRetries: number;
    private timeoutMs: number;
    private initialBackoffMs: number;
    private requestCache: Map<string, string> = new Map(); // For idempotency

    constructor(config: Config) {
        this.apiKey = config.apiKey;
        this.maxRetries = config.maxRetries ?? 3;
        this.timeoutMs = config.timeoutMs ?? 30000; // 30 seconds default
        this.initialBackoffMs = config.initialBackoffMs ?? 1000; // 1 second initial backoff
    }

    /**
     * Execute LLM with timeout, retries with exponential backoff, and idempotency
     */
    async executeLLM(prompt: string): Promise<string> {
        // Check cache for idempotency (same prompt = same response)
        const cachedResponse = this.requestCache.get(prompt);
        if (cachedResponse) {
            console.log('✅ Using cached LLM response (idempotent request)');
            return cachedResponse;
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const backoffMs = this.initialBackoffMs * Math.pow(2, attempt - 1);
                    console.log(`⏳ Retrying LLM request (attempt ${attempt + 1}/${this.maxRetries + 1}) after ${backoffMs}ms backoff...`);
                    await this.sleep(backoffMs);
                }

                const result = await this.executeWithTimeout(prompt);

                // Cache successful response for idempotency
                this.requestCache.set(prompt, result);

                return result;
            } catch (error) {
                lastError = error as Error;

                if (this.isRetryableError(error)) {
                    console.warn(`⚠️ Retryable error on attempt ${attempt + 1}: ${(error as Error).message}`);
                    continue;
                } else {
                    // Non-retryable error, fail immediately
                    throw this.enhanceErrorMessage(error);
                }
            }
        }

        // All retries exhausted
        throw new Error(
            `❌ LLM request failed after ${this.maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`
        );
    }

    /**
     * Execute LLM call with timeout
     */
    private async executeWithTimeout(prompt: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timed out after ${this.timeoutMs}ms`));
            }, this.timeoutMs);

            try {
                const genAI = new GoogleGenerativeAI(this.apiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash-lite",
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.1, // Low temperature for more predictable, deterministic output
                    }
                });

                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();

                clearTimeout(timeoutId);
                resolve(text);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Determine if error is retryable (network issues, rate limits, etc.)
     */
    private isRetryableError(error: unknown): boolean {
        const errorMessage = (error as Error).message?.toLowerCase() || '';

        // Retryable errors: network issues, rate limits, timeouts, server errors
        const retryablePatterns = [
            'timeout',
            'network',
            'econnreset',
            'enotfound',
            'rate limit',
            'quota exceeded',
            '429',
            '500',
            '502',
            '503',
            '504'
        ];

        return retryablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Enhance error messages with context
     */
    private enhanceErrorMessage(error: unknown): Error {
        const originalError = error as Error;
        const errorMessage = originalError.message || 'Unknown error';

        if (errorMessage.includes('API key')) {
            return new Error('❌ API Authentication Error: Invalid or missing API key. Please check your Gemini API key configuration.');
        }
        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return new Error('❌ API Quota Error: Rate limit or quota exceeded. Please wait before retrying or upgrade your API plan.');
        }
        if (errorMessage.includes('timeout')) {
            return new Error(`❌ Timeout Error: Request exceeded ${this.timeoutMs}ms timeout. The LLM may be overloaded or network is slow.`);
        }
        if (errorMessage.includes('network') || errorMessage.includes('ECONNRESET')) {
            return new Error('❌ Network Error: Failed to connect to Gemini API. Please check your internet connection.');
        }

        return new Error(`❌ LLM Error: ${errorMessage}`);
    }

    /**
     * Sleep utility for backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache (useful for testing or forcing fresh responses)
     */
    clearCache(): void {
        this.requestCache.clear();
    }
  }
  ```

2. You should not define the prompt inside the action. Instead requestAdaptiveScheduleAI takes contexted_prompt as a String, which is a prompt with provided context. The action should simply send this context_prompt as a prompt to the llm.

# file: src/concepts/AdaptiveSchedule/AdaptiveSchedule.ts

# response:

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM, Config as GeminiConfig } from "@utils/GeminiLLM.ts"; // Assuming GeminiLLM is in @utils

// Declare collection prefix, use concept name
const PREFIX = "AdaptiveSchedule" + ".";

// Generic types of this concept
type User = ID;
// Assuming GeminiLLM is handled as a class instance, not a generic type in the state relations directly.
// The concept refers to 'an llm GeminiLLM', implying an instance that the concept interacts with.

/**
 * a set of AdaptiveBlocks with
 *   a timeBlockId String
 *   an owner User
 *   a start TimeStamp
 *   an end TimeStamp
 *   a taskIdSet set of Strings
 */
interface AdaptiveBlock {
  _id: ID; // Maps to timeBlockId
  owner: User;
  start: Date; // TimeStamp maps to Date in TS
  end: Date;   // TimeStamp maps to Date in TS
  taskIdSet: ID[];
}

/**
 * a set of droppedTasks with
 *   a taskId String
 *   an owner User
 *   a reason String
 */
interface DroppedTask {
  _id: ID; // Using _id for consistency, can be same as taskId if unique globally
  taskId: ID;
  owner: User;
  reason: string;
}

/**
 * Expected JSON structure from LLM for adaptive schedule proposals.
 * The LLM should not generate `timeBlockId` as the concept's `addTimeBlock`
 * or `assignAdaptiveSchedule` is responsible for that.
 */
interface LlmLikelyResponse {
  adaptiveBlocks: Array<{
    start: string; // ISO string for Date
    end: string;   // ISO string for Date
    taskIds: ID[];
  }>;
  droppedTasks: Array<{
    taskId: ID;
    reason: string;
  }>;
}

export default class AdaptiveScheduleConcept {
  adaptiveBlocks: Collection<AdaptiveBlock>;
  droppedTasks: Collection<DroppedTask>;
  private llm: GeminiLLM;

  constructor(private readonly db: Db, llmConfig: GeminiConfig) {
    this.adaptiveBlocks = this.db.collection(PREFIX + "adaptiveBlocks");
    this.droppedTasks = this.db.collection(PREFIX + "droppedTasks");
    this.llm = new GeminiLLM(llmConfig);

    // Ensure indexes for efficient lookup and uniqueness checks
    this.adaptiveBlocks.createIndex({ owner: 1, start: 1, end: 1 }, { unique: true });
    this.droppedTasks.createIndex({ taskId: 1, owner: 1 }, { unique: true });
    this.adaptiveBlocks.createIndex({ owner: 1 });
  }

  /**
   * _getAdaptiveSchedule (owner: User): (adaptiveBlockTable: set of AdaptiveBlocks)
   *
   * **requires** exists at least one adaptive block under this user
   *
   * **effect** return a set of all adaptive blocks under this owner with end before the end of the day
   */
  async _getAdaptiveSchedule({ owner }: { owner: User }): Promise<{ adaptiveBlockTable: AdaptiveBlock[] } | { error: string }> {
    try {
      // "end before the end of the day" is ambiguous without a specific date input.
      // Assuming it means 'for the current day' as perceived by the system,
      // this would require passing a reference date or determining it here.
      // For simplicity and to avoid making assumptions without a date parameter,
      // this implementation will return all adaptive blocks for the owner.
      // A more complete implementation would require an additional `day` parameter or context.

      const blocks = await this.adaptiveBlocks.find({ owner }).toArray();
      if (blocks.length === 0) {
        return { error: `No adaptive blocks found for user ${owner}` };
      }
      return { adaptiveBlockTable: blocks };
    } catch (error) {
      console.error(`Error in _getAdaptiveSchedule: ${error.message}`);
      return { error: `Failed to retrieve adaptive schedule: ${error.message}` };
    }
  }

  /**
   * _getDroppedTask(owner: User): (droppedTaskSet: set of droppedTasks)
   *
   * **requires** exists at least one dropped task with this owner
   *
   * **effect** returns all dropped tasks for the user (tasks that couldn't be scheduled due to insufficient time)
   */
  async _getDroppedTask({ owner }: { owner: User }): Promise<{ droppedTaskSet: DroppedTask[] } | { error: string }> {
    try {
      const tasks = await this.droppedTasks.find({ owner }).toArray();
      if (tasks.length === 0) {
        return { error: `No dropped tasks found for user ${owner}` };
      }
      return { droppedTaskSet: tasks };
    } catch (error) {
      console.error(`Error in _getDroppedTask: ${error.message}`);
      return { error: `Failed to retrieve dropped tasks: ${error.message}` };
    }
  }

  /**
   * addTimeBlock (owner: User, start: TimeStamp, end: TimeStamp) : (timeBlockId: String)
   *
   * **requires**
   *   start and end are valid TimeStamps;
   *   start is before end;
   *   no adaptive time block exists with this owner, start, and end;
   *
   * **effect**
   *   create a new adaptive time block $b$ with this owner, start, and end;
   *   assign $b$ an empty taskIdSet;
   *   return b.timeBlockId;
   */
  async addTimeBlock({ owner, start, end }: { owner: User; start: Date; end: Date }): Promise<{ timeBlockId: ID } | { error: string }> {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      return { error: "Invalid 'start' TimeStamp." };
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      return { error: "Invalid 'end' TimeStamp." };
    }
    if (start.getTime() >= end.getTime()) {
      return { error: "'start' TimeStamp must be before 'end' TimeStamp." };
    }

    try {
      const existingBlock = await this.adaptiveBlocks.findOne({ owner, start, end });
      if (existingBlock) {
        return { error: "An adaptive time block with this owner, start, and end already exists." };
      }

      const newBlockId = freshID();
      const newBlock: AdaptiveBlock = {
        _id: newBlockId,
        owner,
        start,
        end,
        taskIdSet: [],
      };

      await this.adaptiveBlocks.insertOne(newBlock);
      return { timeBlockId: newBlockId };
    } catch (error) {
      console.error(`Error in addTimeBlock: ${error.message}`);
      return { error: `Failed to add time block: ${error.message}` };
    }
  }

  /**
   * assignAdaptiveSchedule (owner: User, taskId: String, start: TimeStamp, end: TimeStamp): (timeBlockId: String)
   *
   * **requires**
   *   if exists adaptive block $b$ with matching (owner, start, end), then taskId is not in b.taskIdSet;
   *
   * **effect**
   *   if b doesn't exist, create it with owner, start, and end (same logic as addTimeBlock);
   *   add taskId to this adaptive block's taskIdSet;
   *   return b.timeBlockId;
   */
  async assignAdaptiveSchedule({ owner, taskId, start, end }: { owner: User; taskId: ID; start: Date; end: Date }): Promise<{ timeBlockId: ID } | { error: string }> {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      return { error: "Invalid 'start' TimeStamp." };
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      return { error: "Invalid 'end' TimeStamp." };
    }
    if (start.getTime() >= end.getTime()) {
      return { error: "'start' TimeStamp must be before 'end' TimeStamp." };
    }

    try {
      const existingBlock = await this.adaptiveBlocks.findOne({ owner, start, end });

      if (existingBlock) {
        if (existingBlock.taskIdSet.includes(taskId)) {
          return { error: `Task ${taskId} is already assigned to the block with ID ${existingBlock._id}.` };
        }

        const updateResult = await this.adaptiveBlocks.updateOne(
          { _id: existingBlock._id },
          { $addToSet: { taskIdSet: taskId } }
        );

        if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
          return { error: "Failed to update existing block with task." };
        }
        return { timeBlockId: existingBlock._id };

      } else {
        const newBlockId = freshID();
        const newBlock: AdaptiveBlock = {
          _id: newBlockId,
          owner,
          start,
          end,
          taskIdSet: [taskId],
        };

        await this.adaptiveBlocks.insertOne(newBlock);
        return { timeBlockId: newBlockId };
      }
    } catch (error) {
      console.error(`Error in assignAdaptiveSchedule: ${error.message}`);
      return { error: `Failed to assign adaptive schedule: ${error.message}` };
    }
  }

  /**
   * async requestAdaptiveScheduleAI (owner: User, contexted_prompt: String): (adaptiveBlockTable: set of AdaptiveBlocks, droppedTaskSet: set of droppedTasks)
   *
   * **effect**
   *   send the structured contexted_prompt to the llm;
   *   llm returns a structured JSON response including:
   *     - adaptiveBlocks (with start/end times and assigned task ids)
   *     - droppedTasks (tasks removed due to insufficient time)
   *       - each droppedTask has a task id and a reason for dropping
   *   for each adaptive block in llm's returned adaptiveBlocks, assign the task id to the corresponding adaptive block with matching (owner, start, end) using the same logic as assignAdaptiveSchedule;
   *   for each dropped task in droppedTasks, add to state with (taskId, owner, reason)
   *   return the set of all AdaptiveBlocks and the set of all droppedTasks under this owner;
   */
  async requestAdaptiveScheduleAI(
    { owner, contexted_prompt }: { owner: User; contexted_prompt: string },
  ): Promise<{ adaptiveBlockTable: AdaptiveBlock[]; droppedTaskSet: DroppedTask[] } | { error: string }> {
    try {
      const llmResponseText = await this.llm.executeLLM(contexted_prompt);
      let llmResponse: LlmLikelyResponse;

      try {
        llmResponse = JSON.parse(llmResponseText);
      } catch (parseError) {
        return { error: `LLM response was not valid JSON: ${parseError.message}. Response: ${llmResponseText}` };
      }

      if (!llmResponse.adaptiveBlocks || !Array.isArray(llmResponse.adaptiveBlocks)) {
        return { error: "LLM response missing 'adaptiveBlocks' array." };
      }
      if (!llmResponse.droppedTasks || !Array.isArray(llmResponse.droppedTasks)) {
        return { error: "LLM response missing 'droppedTasks' array." };
      }

      const assignedBlockIds: ID[] = [];
      for (const block of llmResponse.adaptiveBlocks) {
        const start = new Date(block.start);
        const end = new Date(block.end);

        for (const taskId of block.taskIds) {
          const assignResult = await this.assignAdaptiveSchedule({ owner, taskId, start, end });
          if ("error" in assignResult) {
            console.warn(`Warning: Could not assign task ${taskId} from LLM proposal: ${assignResult.error}`);
            // Depending on policy, might choose to stop or continue. For now, continue and log.
          } else {
            assignedBlockIds.push(assignResult.timeBlockId);
          }
        }
      }

      const newDroppedTasks: DroppedTask[] = [];
      for (const dropped of llmResponse.droppedTasks) {
        const newDroppedTask: DroppedTask = {
          _id: freshID(), // Ensure a unique _id for the collection
          taskId: dropped.taskId,
          owner: owner,
          reason: dropped.reason,
        };
        try {
          // Use upsert to avoid duplicate inserts if LLM proposes the same dropped task multiple times,
          // assuming taskId+owner is a unique key for dropped tasks.
          await this.droppedTasks.updateOne(
            { taskId: newDroppedTask.taskId, owner: newDroppedTask.owner },
            { $set: newDroppedTask },
            { upsert: true }
          );
          newDroppedTasks.push(newDroppedTask);
        } catch (insertError) {
          console.warn(`Warning: Could not add dropped task ${dropped.taskId}: ${insertError.message}`);
        }
      }

      const getBlocksResult = await this._getAdaptiveSchedule({ owner });
      const getDroppedTasksResult = await this._getDroppedTask({ owner });

      const finalAdaptiveBlocks = "adaptiveBlockTable" in getBlocksResult ? getBlocksResult.adaptiveBlockTable : [];
      const finalDroppedTasks = "droppedTaskSet" in getDroppedTasksResult ? getDroppedTasksResult.droppedTaskSet : [];

      return { adaptiveBlockTable: finalAdaptiveBlocks, droppedTaskSet: finalDroppedTasks };

    } catch (error) {
      console.error(`Error in requestAdaptiveScheduleAI: ${error.message}`);
      return { error: `Failed to request adaptive schedule from AI: ${error.message}` };
    }
  }

  /**
   * unassignBlock (owner: User, taskId: String, timeBlockId: String)
   *
   * **requires**
   *   exists an adaptive block with matching owner and timeBlockId;
   *   taskId exists in this time block's taskIdSet;
   *
   * **effect**
   *   remove taskId from that block's taskIdSet
   */
  async unassignBlock({ owner, taskId, timeBlockId }: { owner: User; taskId: ID; timeBlockId: ID }): Promise<Empty | { error: string }> {
    try {
      const block = await this.adaptiveBlocks.findOne({ _id: timeBlockId, owner });
      if (!block) {
        return { error: `Adaptive block with ID ${timeBlockId} not found for owner ${owner}.` };
      }

      if (!block.taskIdSet.includes(taskId)) {
        return { error: `Task ${taskId} not found in block ${timeBlockId}.` };
      }

      const updateResult = await this.adaptiveBlocks.updateOne(
        { _id: timeBlockId, owner },
        { $pull: { taskIdSet: taskId } }
      );

      if (updateResult.modifiedCount === 0) {
        return { error: `Failed to unassign task ${taskId} from block ${timeBlockId}.` };
      }

      return {};
    } catch (error) {
      console.error(`Error in unassignBlock: ${error.message}`);
      return { error: `Failed to unassign task: ${error.message}` };
    }
  }
}
```
# response:

