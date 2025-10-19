# Concept Update Summary
Compared with how I defined my four concepts in [Assignment 2](https://github.com/Avril-Cui/61040-portfolio/blob/main/assignments/assignment2.md), I have made several changes. I will walk through the major updates in each concept.
## TaskCatalog
1.	Unified time representation. As pointed out by the grader, I previously mixed TimeStamp and Time types, which caused ambiguity. I standardized on using TimeStamp for attributes like deadline to maintain consistency across the concept and improve database integration.
2.	Normalized slack type. In Assignment 2, the slack attribute was sometimes treated as a String. I changed it to a Number type (representing minutes) to ensure consistency and enable arithmetic operations such as computing scheduling buffers.
3.	Removed verifyTime action. The grader noted that verifyTime violated separation of concerns, since it required access to internal scheduling data (start and end times) outside the TaskCatalog’s scope. Upon reflection, I agree. This functionality belongs to synchronization, not in task management concept.
4.	Added deleteSchedule action. To complement assignSchedule, I added a corresponding deleteSchedule action. This provides users the ability to remove a specific timeBlockId from a task’s timeBlockSet, making timeBlockSet interface symmetrical and complete.
5.	Refined dependency management. In Assignment 2, dependency updates were handled implicitly inside updateTask, which was prone to inconsistencies. I refactored this logic into explicit actions:
  - addPreDependence
	- removePreDependence
  This change makes dependency relationships clearer, ensures two-way consistency between preDependence and postDependence, and improves testability. The reason why I kept both preDependence and postDependence is that, postDependence is crucial to trace tasks back when deleteTask is called, while preDependence is important for the sync when we are scheduling tasks.
6.	General cleanup. I fixed minor issues such as typos, inconsistent capitalization (e.g., taskID -> taskId), and improved comment clarity. I also added underscore before the query _getUserTasks to note that it's a query. These changes improve readability and reduce ambiguity during implementation and testing.

## ScheduleTime
1. Unified time representation. In Assignment 2, I used the Time type for the start and end attributes of each time block. This was inconsistent with the rest of the system (e.g., TaskCatalog and AdaptiveSchedule) which use TimeStamp. I updated all time-related fields to TimeStamp to maintain consistency and enable precise scheduling and comparison across concepts.
2. Introduced internal query naming convention. The query getUserSchedule has been renamed to _getUserSchedule, following the same convention applied to TaskCatalog. This clarifies that it is a query (non-mutating) action used to fetch a user’s time blocks.
3. Clarified end-of-day filtering. The getUserSchedule specification now explicitly states that it only returns future time blocks that end before the end of the day. This refinement aligns the model with realistic daily scheduling use cases and with behavior in the implemented tests.
4. Improved assignTimeBlock logic. The original version used an implicit assumption that addTimeBlock must be called before assigning tasks. The new version integrates auto-block creation logic. If the desired block doesn’t exist, assignTimeBlock automatically creates it (following the same structure as addTimeBlock).

## RoutineLog
1. Removed Task as a direct parameterized type. In Assignment 2, RoutineLog was defined as RoutineLog [User, Task], meaning it depended directly on the Task type, while sort of violates modularity. I refactored it to RoutineLog [User] and now reference tasks only by their unique IDs (strings) rather than full task objects. This change makes RoutineLog more modular and decoupled from TaskCatalog, ensuring that activity tracking can function independently of task definitions.
2. Unified time representation. In the original version, the start and end attributes used the Time type, while other concepts used TimeStamp. I replaced all Time types with TimeStamp to maintain consistency across the system and enable cross-concept time comparison and analysis.
3. Renamed and clarified query action. Renamed getUserSessions to _getUserSessions to indicate that it is a query (non-mutating) action. This aligns with the naming convention used in the updated concepts and backend implementation.
4. Rename pauseSession to interruptSession, which is more consistent with the principle of the concept. Also enhanced the logic of interruptSession by adding stronger require statement `session has isPaused as False;`.

## AdaptiveSchedule
This is the concept that underwent the most significant redesign to improve clarity, modularity, and conceptual separation. It now achieves full independence from other concepts while retaining the ability to coordinate with them through the synchronization.

1. In previous versions (Assignments 2 and 3), the requestAdaptiveScheduleAI action explicitly took the llm as an argument. Through Piazza discussions, I realized the LLM instance should be part of the concept’s internal state, not repeatedly passed into actions. Now, GeminiLLM is defined as a field of the concept itself and initialized in the constructor. This makes the concept cleaner.
2. Previously, requestAdaptiveScheduleAI required multiple structured inputs, specifically Task, Schedule, and Routine, to provide the LLM with the full system context. This design caused cross-concept dependency: AdaptiveSchedule needs knowledge about other concepts' states, violating modularity. In the new version, the action only takes a `contexted_prompt` string as input. This prompt is pre-composed by the sync layer, which gathers information from TaskCatalog, ScheduleTime, and RoutineLog before passing it to AdaptiveSchedule action. This refactoring ensures that AdaptiveSchedule no longer depends on the internal state or structure of other concepts, achieving clean separation of concerns.
3. All time fields (start, end) now use TimeStamp instead of Time, aligning with the standard across other concepts.
4. Tasks within adaptive blocks are now referenced only by their unique task IDs (strings) rather than as full Task objects. This ensures modular independence from TaskCatalog.
5. I introduced two new explicit query actions: _getAdaptiveSchedule and _getDroppedTask. These use the same underscore prefix convention adopted throughout the system to denote pure queries (read-only operations).
6. The droppedTasks structure now explicitly includes a reason for each dropped task, improving interpretability and transparency of the LLM's decisions.

