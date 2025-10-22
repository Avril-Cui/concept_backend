/**
 * Setup Script for Friday's Schedule and Sessions
 *
 * This script clears all existing data for user Friday and populates:
 * 1. Scheduled tasks for a typical workday
 * 2. Logged sessions showing what actually happened (with interruptions)
 * 3. Links between sessions and scheduled tasks where names match
 */

const API_BASE_URL = 'http://localhost:8000'
const CURRENT_USER = 'Friday'

// MongoDB connection (for direct database updates)
let mongoClient = null
let db = null

// Helper function to make API calls
async function apiCall(endpoint, body) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok || data.error) {
    throw new Error(data.error || `API call failed: ${endpoint}`)
  }
  return data
}

// Connect to MongoDB for direct updates
async function connectMongoDB() {
  // Load environment variables
  const dotenv = await import('dotenv')
  const path = await import('path')
  const url = await import('url')

  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  dotenv.default.config({ path: path.join(__dirname, '.env') })

  const { MongoClient } = await import('mongodb')
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017'
  const dbName = process.env.DB_NAME || 'my-app-db'

  console.log(`Connecting to MongoDB: ${dbName}`)
  mongoClient = new MongoClient(mongoUrl)
  await mongoClient.connect()
  db = mongoClient.db(dbName)
  console.log('Connected to MongoDB\n')
}

// Close MongoDB connection
async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close()
    console.log('\nMongoDB connection closed')
  }
}

// Helper to create timestamp for a specific date and time
// Returns a timestamp in milliseconds
// Uses local timezone to avoid UTC conversion issues
function createDateTime(year, month, day, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(year, month, day, hours, minutes, 0, 0)
  return date.getTime()
}

// Helper to get the current time in milliseconds
function getCurrentTime() {
  return Date.now()
}

// Schedule date - using today's date (server now returns all time blocks including past ones)
const today = new Date()
const SCHEDULE_YEAR = today.getFullYear()
const SCHEDULE_MONTH = today.getMonth() // 0-indexed
const SCHEDULE_DAY = today.getDate()
const SCHEDULE_DATE_DISPLAY = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

// Scheduled tasks for the day
const scheduledTasks = [
  {
    taskName: 'Daily Stand-Up',
    category: 'Meeting',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '09:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '10:00'),
    duration: 60,
    priority: 2,
    splittable: false,
  },
  {
    taskName: 'Product Roadmap Planning',
    category: 'Meeting',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '10:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '11:00'),
    duration: 60,
    priority: 2,
    splittable: false,
  },
  {
    taskName: 'Write Product Spec',
    category: 'Focus Work',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '11:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '12:00'),
    duration: 60,
    priority: 1,
    splittable: true,
  },
  {
    taskName: 'Lunch Break',
    category: 'Break',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '12:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '13:00'),
    duration: 60,
    priority: 3,
    splittable: false,
  },
  {
    taskName: 'Review Customer Feedback',
    category: 'Focus Work',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '13:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '14:00'),
    duration: 60,
    priority: 1,
    splittable: false,
  },
  {
    taskName: 'Team Sync',
    category: 'Meeting',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '14:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '15:00'),
    duration: 60,
    priority: 2,
    splittable: false,
  },
  {
    taskName: 'Continue Product Spec',
    category: 'Focus Work',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '15:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '16:00'),
    duration: 60,
    priority: 1,
    splittable: true,
  },
  {
    taskName: 'Review Roadmap Slides',
    category: 'Focus Work',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '16:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:00'),
    duration: 60,
    priority: 2,
    splittable: false,
  },
  {
    taskName: 'Wrap-Up / Emails',
    category: 'Administrative',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:30'),
    duration: 30,
    priority: 3,
    splittable: false,
  },
]

// Logged sessions - what actually happened
const loggedSessions = [
  {
    sessionName: 'Daily Stand-Up',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '09:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '10:00'),
    type: 'On Schedule',
    interruptReason: null,
  },
  {
    sessionName: 'Product Roadmap Planning',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '10:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '11:00'),
    type: 'On Schedule',
    interruptReason: null,
  },
  {
    sessionName: 'Ad-hoc Engineering Call',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '11:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '12:00'),
    type: 'Unplanned',
    interruptReason: 'Urgent issue from engineering team',
  },
  {
    sessionName: 'Extended Ad-hoc Meeting',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '12:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '13:00'),
    type: 'Unplanned',
    interruptReason: 'Follow-up discussion from engineering call (ran long)',
  },
  {
    sessionName: 'Lunch + Urgent Ping',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '13:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '14:00'),
    type: 'Unplanned',
    interruptReason: 'Marketing request for quick product summary',
  },
  {
    sessionName: 'Team Sync',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '14:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '15:00'),
    type: 'On Schedule',
    interruptReason: null,
  },
  {
    sessionName: 'Ad-hoc Cross-Dept Check-In',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '15:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '16:00'),
    type: 'Unplanned',
    interruptReason: 'Unexpected alignment meeting (ran long)',
  },
  {
    sessionName: 'Review Roadmap Slides',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '16:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:00'),
    type: 'On Schedule',
    interruptReason: 'Interrupted midway by new task from lead',
  },
  {
    sessionName: 'Wrap-Up / Emails',
    start: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:00'),
    end: createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:30'),
    type: 'On Schedule',
    interruptReason: null,
  },
]

// Step 1: Clear all existing data for user Friday
async function clearAllData() {
  console.log('\n=== Step 1: Clearing existing data for user Friday ===\n')

  try {
    // Get all tasks
    const tasksResponse = await apiCall('/api/TaskCatalog/_getUserTasks', { owner: CURRENT_USER })
    const tasks = tasksResponse.taskTable || []

    // Delete each task (this also removes associated time blocks)
    for (const task of tasks) {
      console.log(`   Deleting task: ${task.taskName}`)
      await apiCall('/api/TaskCatalog/deleteTask', { owner: CURRENT_USER, taskId: task._id })
    }

    console.log(`   ✓ Deleted ${tasks.length} tasks and their schedules`)
  } catch (error) {
    console.log('   No tasks to delete or error:', error.message)
  }

  // Delete all sessions directly from MongoDB since there's no API endpoint
  try {
    const sessionsDeleted = await db.collection('RoutineLog.sessions').deleteMany({ owner: CURRENT_USER })
    console.log(`   ✓ Deleted ${sessionsDeleted.deletedCount} sessions`)
  } catch (error) {
    console.log('   No sessions to delete or error:', error.message)
  }

  console.log('   ✓ Data cleared successfully\n')
}

// Step 2: Create scheduled tasks with time blocks
async function createScheduledTasks() {
  console.log('=== Step 2: Creating scheduled tasks ===\n')

  const taskIdMap = new Map()

  for (const task of scheduledTasks) {
    // Create the task
    console.log(`   Creating task: ${task.taskName}`)
    const taskResponse = await apiCall('/api/TaskCatalog/createTask', {
      owner: CURRENT_USER,
      taskName: task.taskName,
      category: task.category,
      duration: task.duration,
      priority: task.priority,
      splittable: task.splittable,
    })

    const taskId = taskResponse.task._id

    // Assign it to a time block (this creates the time block and adds task to it)
    const timeBlockResponse = await apiCall('/api/ScheduleTime/assignTimeBlock', {
      owner: CURRENT_USER,
      taskId: taskId,
      start: task.start,
      end: task.end,
    })

    const timeBlockId = timeBlockResponse.timeBlockId

    // Link the time block back to the task (this adds timeBlockId to task's timeBlockSet)
    await apiCall('/api/TaskCatalog/assignSchedule', {
      owner: CURRENT_USER,
      taskId: taskId,
      timeBlockId: timeBlockId,
    })

    taskIdMap.set(task.taskName, taskId)

    const startTime = new Date(task.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const endTime = new Date(task.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    console.log(`   ✓ Scheduled ${task.taskName} (${startTime} - ${endTime})`)
  }

  console.log(`\n   ✓ Created ${scheduledTasks.length} scheduled tasks\n`)
  return taskIdMap
}

// Step 3: Create logged sessions with direct database update
async function createLoggedSessions(taskIdMap) {
  console.log('=== Step 3: Creating logged sessions ===\n')

  for (const session of loggedSessions) {
    // Check if this session matches a scheduled task
    const linkedTaskId = taskIdMap.get(session.sessionName) || null

    // Create the session via API
    console.log(`   Creating session: ${session.sessionName}`)

    // First create the session
    const sessionResponse = await apiCall('/api/RoutineLog/createSession', {
      owner: CURRENT_USER,
      sessionName: session.sessionName,
      linkedTaskId: linkedTaskId,
    })

    const sessionId = sessionResponse.session._id

    // Now update the session directly in MongoDB with custom timestamps
    const updateFields = {
      start: session.start,
      end: session.end,
      isActive: false,
    }

    if (session.type) {
      updateFields.type = session.type
    }

    if (session.interruptReason) {
      updateFields.interruptReason = session.interruptReason
      updateFields.isPaused = true
    }

    await db.collection('RoutineLog.sessions').updateOne(
      { _id: sessionId },
      { $set: updateFields }
    )

    const startTime = new Date(session.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const endTime = new Date(session.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    console.log(`   ✓ Logged session ${session.sessionName} (${startTime} - ${endTime})`)

    if (session.interruptReason) {
      console.log(`   ✓ Interrupted: ${session.interruptReason}`)
    }

    if (linkedTaskId) {
      console.log(`   ✓ Linked to scheduled task`)
    } else {
      console.log(`   ✓ Unplanned session (no matching task)`)
    }

    console.log('')
  }

  console.log(`   ✓ Created ${loggedSessions.length} logged sessions\n`)
}

// Step 4: Verify the data
async function verifyData() {
  console.log('=== Step 4: Verification ===\n')

  // Get all tasks
  const tasksResponse = await apiCall('/api/TaskCatalog/_getUserTasks', { owner: CURRENT_USER })
  const tasks = tasksResponse.taskTable || []

  // Get all sessions
  const sessionsResponse = await apiCall('/api/RoutineLog/_getUserSessions', { owner: CURRENT_USER })
  const sessions = sessionsResponse.sessionTable || []

  console.log(`   Total tasks created: ${tasks.length}`)
  console.log(`   Total sessions created: ${sessions.length}`)

  // Count linked vs unplanned sessions
  const linkedSessions = sessions.filter(s => s.linkedTaskId).length
  const unplannedSessions = sessions.length - linkedSessions

  console.log(`   Sessions linked to tasks: ${linkedSessions}`)
  console.log(`   Unplanned sessions: ${unplannedSessions}`)

  // Count interrupted sessions
  const interruptedSessions = sessions.filter(s => s.interruptReason).length
  console.log(`   Interrupted sessions: ${interruptedSessions}`)

  console.log('')
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Setup Script for Friday\'s Schedule and Sessions')
  console.log(`  Date: ${SCHEDULE_DATE_DISPLAY}`)
  console.log(`  Current time: ${new Date().toLocaleString('en-US')}`)
  console.log(`  First time block: ${new Date(createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '09:00')).toLocaleString('en-US')}`)
  console.log(`  Last time block: ${new Date(createDateTime(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, '17:30')).toLocaleString('en-US')}`)
  console.log('═══════════════════════════════════════════════════════')

  try {
    await connectMongoDB()
    await clearAllData()
    const taskIdMap = await createScheduledTasks()
    await createLoggedSessions(taskIdMap)
    await verifyData()

    console.log('═══════════════════════════════════════════════════════')
    console.log('  ✅ Setup Complete!')
    console.log('═══════════════════════════════════════════════════════\n')
    console.log('📊 Summary:')
    console.log('   • Scheduled tasks: 9 (includes meetings, focus work, breaks)')
    console.log('   • Logged sessions: 9 (mix of on-schedule and unplanned)')
    console.log('   • Linked sessions: 4 (Daily Stand-Up, Product Roadmap Planning, Team Sync, Review Roadmap Slides, Wrap-Up / Emails)')
    console.log('   • Unplanned interruptions: 5')
    console.log('\n🎯 Key Insights:')
    console.log('   • Planned focus work (Write Product Spec) was replaced by urgent engineering call')
    console.log('   • Lunch Break was replaced by extended ad-hoc meeting')
    console.log('   • Review Customer Feedback was replaced by urgent ping')
    console.log('   • Continue Product Spec was replaced by cross-dept check-in')
    console.log('   • Review Roadmap Slides was interrupted midway\n')

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await closeMongoDB()
  }
}

main()
