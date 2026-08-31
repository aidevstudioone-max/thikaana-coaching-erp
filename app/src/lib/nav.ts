export interface NavItem {
  label: string
  path: string
  icon: string
  moduleId: string | null // null = always visible (system page)
}

export interface NavSection {
  title: string
  items: NavItem[]
}

// ---- Institute admin portal (Owner / Staff / Accountant) ----
export const ADMIN_NAV: NavSection[] = [
  {
    title: '',
    items: [{ label: 'Dashboard', path: '/', icon: 'LayoutDashboard', moduleId: null }]
  },
  {
    title: 'Academics',
    items: [
      { label: 'Students', path: '/students', icon: 'Users', moduleId: 'students' },
      { label: 'Courses', path: '/courses', icon: 'BookOpen', moduleId: 'courses' },
      { label: 'Batches', path: '/batches', icon: 'Layers', moduleId: 'batches' },
      { label: 'Attendance', path: '/attendance', icon: 'CalendarCheck', moduleId: 'attendance' },
      { label: 'Exams & Results', path: '/exams', icon: 'ClipboardCheck', moduleId: 'exams' },
      { label: 'Homework', path: '/homework', icon: 'PencilLine', moduleId: 'homework' },
      { label: 'Study Materials', path: '/materials', icon: 'FolderOpen', moduleId: 'materials' },
      { label: 'Timetable', path: '/timetable', icon: 'CalendarDays', moduleId: 'timetable' }
    ]
  },
  {
    title: 'Fees',
    items: [
      { label: 'Fee Overview', path: '/fees', icon: 'Wallet', moduleId: 'fees' },
      { label: 'Collect Payment', path: '/fees/collect', icon: 'IndianRupee', moduleId: 'fees' },
      { label: 'Receipts', path: '/fees/receipts', icon: 'ReceiptText', moduleId: 'fees' },
      { label: 'Due Alerts', path: '/fees/dues', icon: 'BellRing', moduleId: 'fees' }
    ]
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Communication', path: '/communication', icon: 'MessageSquare', moduleId: 'communication' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Staff', path: '/staff', icon: 'Contact', moduleId: 'staff' },
      { label: 'Reports', path: '/reports', icon: 'BarChart3', moduleId: 'reports' }
    ]
  },
  {
    title: 'Advanced',
    items: [
      { label: 'AI Insights', path: '/ai-insights', icon: 'Sparkles', moduleId: 'ai_insights' },
      { label: 'Online Classes', path: '/online-classes', icon: 'Video', moduleId: 'online_classes' },
      { label: 'ID Cards', path: '/id-cards', icon: 'IdCard', moduleId: 'id_cards' },
      { label: 'Doubt Box', path: '/doubts', icon: 'HelpCircle', moduleId: 'doubts' }
    ]
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', path: '/notifications', icon: 'Bell', moduleId: null },
      { label: 'Modules', path: '/admin/modules', icon: 'ToggleRight', moduleId: null },
      { label: 'Users', path: '/admin/users', icon: 'UserCog', moduleId: null },
      { label: 'Roles & Permissions', path: '/admin/roles', icon: 'KeyRound', moduleId: null },
      { label: 'Settings', path: '/admin/settings', icon: 'Settings', moduleId: null },
      { label: 'Audit Log', path: '/admin/audit', icon: 'History', moduleId: null }
    ]
  }
]

// ---- Student portal ----
export const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', moduleId: null },
  { label: 'Attendance', path: '/me/attendance', icon: 'CalendarCheck', moduleId: 'attendance' },
  { label: 'Fees', path: '/me/fees', icon: 'Wallet', moduleId: 'fees' },
  { label: 'Subjects', path: '/me/subjects', icon: 'BookOpen', moduleId: 'students' },
  { label: 'Results', path: '/me/results', icon: 'ClipboardCheck', moduleId: 'exams' },
  { label: 'Homework', path: '/me/homework', icon: 'PencilLine', moduleId: 'homework' },
  { label: 'Materials', path: '/me/materials', icon: 'FolderOpen', moduleId: 'materials' },
  { label: 'Timetable', path: '/me/timetable', icon: 'CalendarDays', moduleId: 'timetable' }
]

// ---- Parent portal ----
export const PARENT_NAV: NavItem[] = [
  { label: 'Overview', path: '/', icon: 'LayoutDashboard', moduleId: null },
  { label: 'Fee Status', path: '/child/fees', icon: 'Wallet', moduleId: 'fees' },
  { label: 'Attendance', path: '/child/attendance', icon: 'CalendarCheck', moduleId: 'attendance' },
  { label: 'Progress', path: '/child/progress', icon: 'TrendingUp', moduleId: 'exams' }
]

// ---- Super Admin platform console ----
export const PLATFORM_NAV: NavItem[] = [
  { label: 'Overview', path: '/', icon: 'LayoutDashboard', moduleId: null },
  { label: 'Institutes', path: '/platform/institutes', icon: 'Building2', moduleId: null },
  { label: 'Subscriptions', path: '/platform/subscriptions', icon: 'CreditCard', moduleId: null },
  { label: 'Billing', path: '/platform/billing', icon: 'ReceiptText', moduleId: null },
  { label: 'Support', path: '/platform/support', icon: 'LifeBuoy', moduleId: null }
]
