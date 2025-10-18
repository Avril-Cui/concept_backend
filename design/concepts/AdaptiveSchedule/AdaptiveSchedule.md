# concept: AdaptiveSchedule

```
concept AdaptiveSchedule [User, GeminiLLM]

purpose: Keeps the schedule responsive by moving, canceling, or creating tasks scheduled at future time blocks when reality diverges, ensuring that highest-priority tasks are achieved first while preserving user productivity.

principle:
   When actual sessions overrun or diverge from the plan, the adaptive scheduler adjusts subsequent planned tasks into adaptive time blocks.
   This process can operate in two modes:
	   (1) Manual mode — user reviews deviations and adjusts future time blocks;
	   (2) AI-augmented mode — an LLM analyzes deviations, infers likely causes, and automatically proposes a revised schedule for future tasks.

state
	a set of AdaptiveBlocks with
	  a timeBlockId String // this is a unique id
	  an owner User
	  a start TimeStamp
	  an end TimeStamp
	  a taskIdSet set of Strings // contains unique ids identifying tasks

	a set of droppedTasks with
	  a taskId String // unique id identifying tasks
	  an owner User
	  a reason
  
	an llm GeminiLLM

invariants
   every adaptive block has a unique timeBlockId;
   start time of every adaptive block is before end time;
   every adaptive block has exactly one owner;
   only one adaptive block exists given (owner, start, end);
   every taskId in each adaptive block's taskIdSet is unique;

actions
	addTimeBlock (owner: User, start: TimeStamp, end: TimeStamp) : (timeBlockId: String)
		requires:
			start and end are valid TimeStamps;
			start is before end;
			no adaptive time block exists with this owner, start, and end;
		effect:
			create a new adaptive time block $b$ with this owner, start, and end;
			assign $b$ an empty taskIdSet;
			return b.timeBlockId;
   
	assignAdaptiveSchedule (owner: User, taskId: String, start: TimeStamp, end: TimeStamp): (timeBlockId: String)
		requires:
			if exists adaptive block $b$ with matching (owner, start, end), then taskId is not in b.taskIdSet;
		effect:
			if b doesn't exist, create it with owner, start, and end (same logic as addTimeBlock);
			add taskId to this adaptive block's taskIdSet;
	
	async requestAdaptiveScheduleAI (owner: User, context: String):
		effect:
			send a structured prompt to the llm with the provided context;
			llm returns a structured JSON response including:
				- adaptiveBlocks (with start/end times and assigned task ids)
				- droppedTasks (tasks removed due to insufficient time)
				  - each droppedTask has a task id and a reason for dropping
			for each adaptive block in llm's returned adaptiveBlocks, assign the task id to the corresponding adaptive block with matching (owner, start, end) using the same logic as assignAdaptiveSchedule;
			for each dropped task in droppedTasks, add to state with (taskId, owner, reason) 
			return the set of all AdaptiveBlocks and the set of all droppedTasks under this owner;

   unassignBlock (owner: User, task: Task, timeBlockId: String)
      requires:
         exists an adaptive block with matching owner and timeBlockId;
         task exists in this time block's taskSet;
      effect:
         remove task from that block's taskSet

   getAdaptiveSchedule(owner: User): (set of AdaptiveBlock)
        requires:
            exists at least one adaptive block with this owner
        effect:
            returns all adaptive blocks owned by the user

   getDroppedTask(owner: User): (set of droppedTasks)
      requires:
         exists at least one dropped task with this user
      effect:
         returns all dropped task for the user (tasks that couldn't be scheduled due to insufficient time)
```