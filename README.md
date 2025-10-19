# Key Directories

## `/src/concepts/`
Contains the implementation of four core concepts:
- **TaskCatalog**: Manages tasks with dependencies, priorities, deadlines, and scheduling
- **ScheduleTime**: Handles time block creation and task assignment to planned schedules
- **RoutineLog**: Records actual session activities and routine tracking
- **AdaptiveSchedule**: AI-powered adaptive scheduling that adjusts plans based on actual routine deviations

Each concept includes:
- Implementation file (`.ts`)
- Comprehensive test suite (`.test.ts`)

### `/src/utils/`
Shared utilities:
- **database.ts**: MongoDB connection management and test database utilities
- **types.ts**: Common type definitions (ID, Empty, etc.)
- **GeminiLLM.ts**: Integration with Google's Gemini AI for adaptive scheduling

## `/design/`
Complete design documentation including concept specifications, implementation notes, testing strategies, and design exploration materials. Interacts with the Context Tool.

### `/design/concepts` key files
Contains my finalized concept specifications and conversations with the Context Tool to generate implementation and test cases. In particular, for each of the four core concepts (i.e., TaskCatalog, ScheduleTime, RoutineLog, AdaptiveSchedule), there are a set of files:
- **`[ConceptName].md`:** contains the finalized concept specification
	- [TaskCatalog](design/concepts/TaskCatalog/TaskCatalog.md)
	- [ScheduleTime](design/concepts/ScheduleTime/ScheduleTime.md)
	- [RoutineLog](design/concepts/RoutineLog/RoutineLog.md)
	- [AdaptiveSchedule](design/concepts/AdaptiveSchedule/AdaptiveSchedule.md)
- **`implementation.md`:**: contains the Context Tool implementation of the concept
	- [TaskCatalog implementation](design/concepts/TaskCatalog/implementation.md)
	- [ScheduleTime implementation](design/concepts/ScheduleTime/implementation.md)
	- [RoutineLog implementation](design/concepts/RoutineLog/implementation.md)
	- [AdaptiveSchedule implementation](design/concepts/AdaptiveSchedule/implementation.md)
- **`testing.md`:**: contains conversation with the Context Tool to generate test cases
	- [TaskCatalog testing](design/concepts/TaskCatalog/testing.md)
	- [ScheduleTime testing](design/concepts/ScheduleTime/testing.md)
	- [RoutineLog testing](design/concepts/RoutineLog/testing.md)
	- [AdaptiveSchedule testing](design/concepts/AdaptiveSchedule/testing.md)

## `/design/results/ConsoleOutput.md`
Contains a copy of the console output showing the execution of the test script for each concept (in markdown).
[ConsoleOutput](design/results/ConsoleOutput.md)

## `/design/results/design.md`
A design file explaining changes I made to the concept as specified in Assignment 2 and any other issues that came up (in markdown). Also records interesting moments with explanation and links to relevant files.

## `/context`
Snapshots that confirm that I worked in a reflective and incremental way.

## Running Tests

```bash
deno test -A
```

## Environment Setup

1. Create a `.env` file with:
  ```
  GEMINI_API_KEY=
  GEMINI_MODEL=gemini-2.5-flash
  GEMINI_CONFIG=./geminiConfig.json
  MONGODB_URL=
  DB_NAME=
   ```

2. Install Deno: https://deno.land/

3. Run tests to verify setup:
   ```bash
   deno test -A
   ```

# Folder Structure

```
concept_backend/
├── src/                          # Source code directory
│   ├── concepts/                 # Concept implementations
│   │   ├── AdaptiveSchedule/    # AI-powered adaptive scheduling concept
│   │   │   ├── AdaptiveSchedule.ts
│   │   │   └── AdaptiveSchedule.test.ts
│   │   ├── RoutineLog/          # Session logging and routine tracking
│   │   │   ├── RoutineLog.ts
│   │   │   └── RoutineLog.test.ts
│   │   ├── ScheduleTime/        # Time block scheduling concept
│   │   │   ├── ScheduleTime.ts
│   │   │   └── ScheduleTime.test.ts
│   │   └── TaskCatalog/         # Task management and dependency tracking
│   │       ├── TaskCatalog.ts
│   │       └── TaskCatalog.test.ts
│   ├── utils/                    # Utility modules
│   │   ├── database.ts          # MongoDB connection and test utilities
│   │   ├── types.ts             # Common TypeScript type definitions
│   │   └── GeminiLLM.ts         # Gemini AI integration for adaptive scheduling
│   └── .claude/                  # Claude Code configuration
│
├── design/                       # Design documentation
│   ├── concepts/                 # Individual concept specifications
│   │   ├── AdaptiveSchedule/
│   │   │   ├── AdaptiveSchedule.md    # Concept specification
│   │   │   ├── implementation.md       # Implementation notes
│   │   │   └── testing.md              # Testing strategy
│   │   ├── LikertSurvey/
│   │   ├── RoutineLog/
│   │   ├── ScheduleTime/
│   │   └── TaskCatalog/
│   ├── background/               # Background reading and guidelines
│   │   ├── concept-design-brief.md
│   │   ├── concept-design-overview.md
│   │   ├── concept-specifications.md
│   │   ├── implementing-concepts.md
│   │   ├── testing-concepts.md
│   │   └── detailed/             # Detailed design guidelines
│   ├── brainstorming/            # Design exploration
│   ├── learning/                 # Learning materials and exercises
│   ├── results/                  # Design outcomes
│   │   ├── design.md            # Final design document
│   │   └── ConsoleOutput.md     # Test output documentation
│   └── tools/                    # Design tools and utilities
│
├── delivery/                     # Submission deliverables
├── media/                        # Media assets
├── context/                      # Context history (AI conversation logs)
│
├── .env                          # Environment variables (MongoDB URL, API keys)
├── .gitignore                    # Git ignore rules
├── config.json                   # Application configuration
├── deno.json                     # Deno configuration and imports
├── deno.lock                     # Deno dependency lock file
├── geminiConfig.json            # Gemini AI configuration
├── ConsoleOutput.md             # Test execution output log
└── README.md                     # This file
```

