import { MODULE_DEFS } from './modules'
import type { ModulePermission, Role } from './types'

export function fullAccess(): ModulePermission {
  return { view: true, create: true, edit: true, delete: true, actions: {} }
}

export function noAccess(): ModulePermission {
  return { view: false, create: false, edit: false, delete: false, actions: {} }
}

function permsFor(map: Record<string, Partial<ModulePermission>>): Record<string, ModulePermission> {
  const out: Record<string, ModulePermission> = {}
  for (const m of MODULE_DEFS) {
    out[m.id] = { ...noAccess(), ...map[m.id] }
  }
  return out
}

const view = { view: true, create: false, edit: false, delete: false, actions: {} }
const viewCreate = { view: true, create: true, edit: false, delete: false, actions: {} }
const viewCreateEdit = { view: true, create: true, edit: true, delete: false, actions: {} }
const all = { view: true, create: true, edit: true, delete: true, actions: {} }

const everyModule = (perm: Partial<ModulePermission>) => Object.fromEntries(MODULE_DEFS.map((m) => [m.id, perm]))

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    isSystem: true,
    isSuperAdmin: true,
    portal: 'PLATFORM',
    description: 'Thikaana platform owner. Manages coaching accounts, subscriptions, billing and support.',
    permissions: permsFor(everyModule(all))
  },
  {
    id: 'role_owner',
    name: 'Institute Owner',
    isSystem: true,
    isSuperAdmin: false,
    portal: 'ADMIN',
    description: 'Head teacher / owner of the coaching centre. Full access to every enabled module.',
    permissions: permsFor(everyModule(all))
  },
  {
    id: 'role_staff',
    name: 'Staff / Teacher',
    isSystem: true,
    isSuperAdmin: false,
    portal: 'ADMIN',
    description: 'Limited access — mark attendance, collect fees, update students, run classes.',
    permissions: permsFor({
      students: viewCreateEdit,
      courses: view,
      batches: view,
      fees: viewCreate,
      attendance: all,
      exams: viewCreateEdit,
      homework: all,
      materials: all,
      timetable: view,
      communication: viewCreate,
      reports: view
    })
  },
  {
    id: 'role_accountant',
    name: 'Accountant',
    isSystem: true,
    isSuperAdmin: false,
    portal: 'ADMIN',
    description: 'Manages fee collection, receipts, dues and financial reports.',
    permissions: permsFor({
      students: view,
      courses: view,
      batches: view,
      fees: all,
      communication: viewCreate,
      reports: view,
      staff: view
    })
  },
  {
    id: 'role_student',
    name: 'Student',
    isSystem: true,
    isSuperAdmin: false,
    portal: 'STUDENT',
    description: 'Student self-service — attendance, fees due, subjects, results, notes and timetable.',
    permissions: permsFor({
      students: view,
      fees: view,
      attendance: view,
      exams: view,
      homework: viewCreate,
      materials: view,
      timetable: view
    })
  },
  {
    id: 'role_parent',
    name: 'Parent',
    isSystem: true,
    isSuperAdmin: false,
    portal: 'PARENT',
    description: 'Parent view — child fee status, attendance and progress reports.',
    permissions: permsFor({
      students: view,
      fees: view,
      attendance: view,
      exams: view,
      timetable: view
    })
  }
]

export function hasPermission(
  role: Role | undefined,
  moduleId: string,
  action: keyof Omit<ModulePermission, 'actions'> | string
): boolean {
  if (!role) return false
  if (role.isSuperAdmin) return true
  const p = role.permissions[moduleId]
  if (!p) return false
  if (action === 'view' || action === 'create' || action === 'edit' || action === 'delete') return p[action]
  return !!p.actions[action]
}
