import type { ModuleDef, ModuleState, ModuleStatus } from './types'

// The module registry is the spine of the whole application: every admin nav item
// and route is gated by whether its module is ENABLED here (see ModuleContext +
// Layout). dependsOn encodes the dependency graph — a module cannot be enabled
// unless everything it depends on is already enabled, and cannot be disabled while
// something enabled still depends on it. This is what lets you sell one product to
// a home tutor (Students + Fees only) and to a JEE/NEET centre (everything on).

export const MODULE_DEFS: ModuleDef[] = [
  // CORE
  {
    id: 'students',
    name: 'Student Management',
    category: 'CORE',
    description: 'Student profiles, guardians, documents, admissions and lifecycle.',
    dependsOn: [],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'courses',
    name: 'Course Management',
    category: 'CORE',
    description: 'Courses / programs with duration, fee structure and subjects.',
    dependsOn: [],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'batches',
    name: 'Batch Management',
    category: 'CORE',
    description: 'Morning / evening / weekend batches with timings, capacity and teacher.',
    dependsOn: ['courses'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'fees',
    name: 'Fees Management',
    category: 'CORE',
    description: 'Fee plans, installments, collection, receipts and due alerts.',
    dependsOn: ['students'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'attendance',
    name: 'Attendance',
    category: 'CORE',
    description: 'Mark present / absent / late per batch and view attendance reports.',
    dependsOn: ['students', 'batches'],
    defaultStatus: 'ENABLED'
  },
  // ACADEMICS
  {
    id: 'exams',
    name: 'Exam Management',
    category: 'ACADEMICS',
    description: 'Weekly / mock / final tests, marks entry, ranks and subject analysis.',
    dependsOn: ['students'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'homework',
    name: 'Homework & Assignments',
    category: 'ACADEMICS',
    description: 'Assign homework with attachments and track student submissions.',
    dependsOn: ['batches'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'materials',
    name: 'Study Materials',
    category: 'ACADEMICS',
    description: 'Share PDFs, notes and video links; students download from their portal.',
    dependsOn: ['courses'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'timetable',
    name: 'Timetable',
    category: 'ACADEMICS',
    description: 'Weekly class schedule per batch and per teacher.',
    dependsOn: ['batches'],
    defaultStatus: 'ENABLED'
  },
  // ENGAGEMENT
  {
    id: 'communication',
    name: 'Communication Center',
    category: 'ENGAGEMENT',
    description: 'WhatsApp / SMS / email blasts for fees, attendance and exams.',
    dependsOn: ['students'],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'parent_portal',
    name: 'Parent Portal',
    category: 'ENGAGEMENT',
    description: 'Give parents a login for fee status, attendance and progress.',
    dependsOn: ['students'],
    defaultStatus: 'ENABLED'
  },
  // BUSINESS
  {
    id: 'staff',
    name: 'Staff Management',
    category: 'BUSINESS',
    description: 'Teachers and front-desk staff, roles and staff attendance.',
    dependsOn: [],
    defaultStatus: 'ENABLED'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    category: 'BUSINESS',
    description: 'Financial, student performance and coaching growth reports.',
    dependsOn: [],
    defaultStatus: 'ENABLED'
  },
  // ADVANCED / Phase 2
  {
    id: 'ai_insights',
    name: 'AI Insights',
    category: 'ADVANCED',
    description: 'Performance prediction and fee-collection risk scoring.',
    dependsOn: ['exams', 'fees'],
    defaultStatus: 'DISABLED'
  },
  {
    id: 'online_classes',
    name: 'Online Classes',
    category: 'ADVANCED',
    description: 'Live class links and recorded lecture library per batch.',
    dependsOn: ['batches'],
    defaultStatus: 'DISABLED'
  },
  {
    id: 'id_cards',
    name: 'Student ID Cards',
    category: 'ADVANCED',
    description: 'Generate printable student ID cards with QR codes.',
    dependsOn: ['students'],
    defaultStatus: 'DISABLED'
  },
  {
    id: 'doubts',
    name: 'Doubt Management',
    category: 'ADVANCED',
    description: 'Students raise subject doubts; teachers respond and close.',
    dependsOn: ['students'],
    defaultStatus: 'DISABLED'
  }
]

export const MODULE_MAP: Record<string, ModuleDef> = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m]))

export function defaultModuleStates(): ModuleState[] {
  return MODULE_DEFS.map((m) => ({
    id: m.id,
    status: m.defaultStatus,
    ...(m.defaultStatus === 'ENABLED' ? { enabledAt: new Date().toISOString() } : {})
  }))
}

export function directDependents(moduleId: string): ModuleDef[] {
  return MODULE_DEFS.filter((m) => m.dependsOn.includes(moduleId))
}

// All modules (direct + transitive) that would need to be disabled first.
export function transitiveDependents(moduleId: string, states: ModuleState[]): ModuleDef[] {
  const enabledIds = new Set(states.filter((s) => s.status === 'ENABLED').map((s) => s.id))
  const result: ModuleDef[] = []
  const seen = new Set<string>()
  const queue = [moduleId]
  while (queue.length) {
    const current = queue.shift()!
    for (const dep of directDependents(current)) {
      if (enabledIds.has(dep.id) && !seen.has(dep.id)) {
        seen.add(dep.id)
        result.push(dep)
        queue.push(dep.id)
      }
    }
  }
  return result
}

export function missingDependencies(moduleId: string, states: ModuleState[]): ModuleDef[] {
  const def = MODULE_MAP[moduleId]
  const statusOf = (id: string) => states.find((s) => s.id === id)?.status ?? 'DISABLED'
  return def.dependsOn.filter((id) => statusOf(id) !== 'ENABLED').map((id) => MODULE_MAP[id])
}

export function statusOf(states: ModuleState[], id: string): ModuleStatus {
  return states.find((s) => s.id === id)?.status ?? 'DISABLED'
}

export const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  ACADEMICS: 'Academics',
  ENGAGEMENT: 'Engagement',
  BUSINESS: 'Business & Operations',
  ADVANCED: 'Advanced / Phase 2'
}
