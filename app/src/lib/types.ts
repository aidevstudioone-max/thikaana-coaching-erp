// Core domain types for Thikaana Coaching ERP.
// This file is the contract the localStorage repository (db.ts) implements today
// and that a real API / Postgres layer should implement later — see db.ts header.

export type ModuleCategory = 'CORE' | 'ACADEMICS' | 'ENGAGEMENT' | 'BUSINESS' | 'ADVANCED'
export type ModuleStatus = 'ENABLED' | 'DISABLED'

export interface ModuleDef {
  id: string
  name: string
  category: ModuleCategory
  description: string
  dependsOn: string[]
  defaultStatus: ModuleStatus
}

export interface ModuleState {
  id: string
  status: ModuleStatus
  enabledAt?: string
  disabledAt?: string
}

export interface ModulePermission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  actions: Record<string, boolean>
}

export type PortalKind = 'ADMIN' | 'STUDENT' | 'PARENT' | 'PLATFORM'

export interface Role {
  id: string
  name: string
  isSystem: boolean
  isSuperAdmin: boolean
  portal: PortalKind
  description: string
  permissions: Record<string, ModulePermission>
}

export interface Organization {
  id: string
  name: string
  tagline: string
  gstin: string
  address: string
  phone: string
  email: string
  upiId: string
}

export interface Settings {
  currency: string
  receiptPrefix: string
  academicYear: string
  lateFeePerDay: number
  whatsappSenderName: string
}

export interface User {
  id: string
  name: string
  username: string
  email: string
  mobile: string
  password: string
  roleId: string
  // links the login to a domain record when the role is student/parent/staff
  linkedStudentId?: string
  linkedStaffId?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  ts: string
  userId: string
  userName: string
  module: string
  action: string
  entity: string
  entityId?: string
  detail?: string
}

export type Channel = 'in-app' | 'whatsapp' | 'sms' | 'email'

export interface Notification {
  id: string
  ts: string
  type: string
  channel: Channel
  title: string
  message: string
  read: boolean
  severity: 'info' | 'warning' | 'critical'
  link?: string
}

// ---------- Students ----------

export interface StudentDocument {
  id: string
  studentId: string
  type: 'Aadhaar' | 'Photo' | 'Previous Marksheet' | 'Other'
  name: string
  uploadedAt: string
}

export interface Guardian {
  id: string
  studentId: string
  name: string
  relation: 'Father' | 'Mother' | 'Guardian'
  phone: string
  email: string
  occupation: string
}

export interface Student {
  id: string
  admissionNo: string
  name: string
  photoUrl: string
  gender: 'Male' | 'Female' | 'Other'
  dob: string
  mobile: string
  email: string
  address: string
  parentName: string
  parentPhone: string
  courseId: string
  batchId: string
  subjectIds: string[]
  joiningDate: string
  expectedCompletion: string
  status: 'ACTIVE' | 'INACTIVE' | 'DROPPED' | 'COMPLETED'
  createdAt: string
}

// ---------- Courses / Subjects / Batches ----------

export interface Subject {
  id: string
  name: string
  code: string
}

export interface Course {
  id: string
  name: string
  category: 'Competitive' | 'School' | 'Skill'
  durationMonths: number
  totalFees: number
  subjectIds: string[]
  teacherStaffIds: string[]
  status: 'ACTIVE' | 'ARCHIVED'
  createdAt: string
}

export interface Batch {
  id: string
  name: string
  courseId: string
  timing: string
  daysOfWeek: string[] // ['Mon','Wed','Fri']
  capacity: number
  teacherStaffId: string
  room: string
  status: 'ACTIVE' | 'ARCHIVED'
  createdAt: string
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  batchId: string
  enrolledAt: string
}

// ---------- Fees ----------

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card'

export interface FeeInvoice {
  id: string
  invoiceNo: string
  studentId: string
  courseId: string
  title: string // e.g. "Installment 2 of 4"
  amount: number
  dueDate: string
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  paidAmount: number
  createdAt: string
}

export interface Payment {
  id: string
  receiptNo: string
  invoiceId: string
  studentId: string
  amount: number
  mode: PaymentMode
  reference: string
  collectedByStaffId: string
  note: string
  sentWhatsapp: boolean
  sentEmail: boolean
  paidAt: string
}

// ---------- Attendance ----------

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'

export interface AttendanceRecord {
  id: string
  batchId: string
  studentId: string
  date: string // yyyy-mm-dd
  status: AttendanceStatus
  markedByStaffId: string
}

// ---------- Exams ----------

export interface Exam {
  id: string
  name: string
  type: 'Weekly Test' | 'Mock Test' | 'Monthly Test' | 'Final Exam'
  courseId: string
  batchId: string
  subjectId: string
  date: string
  maxMarks: number
  status: 'SCHEDULED' | 'COMPLETED'
  createdAt: string
}

export interface ExamResult {
  id: string
  examId: string
  studentId: string
  marks: number
  remark: string
}

// ---------- Homework / Assignments ----------

export interface Assignment {
  id: string
  title: string
  batchId: string
  subjectId: string
  description: string
  attachmentName: string
  assignedDate: string
  dueDate: string
  createdByStaffId: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  submittedAt: string
  attachmentName: string
  status: 'SUBMITTED' | 'LATE' | 'GRADED'
  grade: string
}

// ---------- Study Materials ----------

export interface Material {
  id: string
  title: string
  courseId: string
  subjectId: string
  kind: 'PDF' | 'Video' | 'Notes' | 'Assignment'
  fileName: string
  sizeLabel: string
  uploadedByStaffId: string
  uploadedAt: string
  downloads: number
}

// ---------- Timetable ----------

export interface TimetableSlot {
  id: string
  batchId: string
  day: string // 'Mon'
  startTime: string // '16:00'
  endTime: string // '17:30'
  subjectId: string
  teacherStaffId: string
  room: string
}

// ---------- Communication ----------

export interface Message {
  id: string
  ts: string
  channel: Channel
  category: 'Fee Reminder' | 'Attendance Alert' | 'Exam Notification' | 'General'
  audience: string // "Batch: JEE Morning" / "Student: Riya Sen"
  recipientCount: number
  body: string
  sentByUserId: string
  status: 'SENT' | 'QUEUED' | 'FAILED'
}

// ---------- Staff ----------

export interface Staff {
  id: string
  staffCode: string
  name: string
  role: 'Teacher' | 'Front Desk' | 'Accountant' | 'Center Head'
  subjects: string[]
  phone: string
  email: string
  salary: number
  joiningDate: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface StaffAttendanceRecord {
  id: string
  staffId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE'
}

// ---------- Super Admin platform console ----------

export interface Institute {
  id: string
  name: string
  ownerName: string
  city: string
  phone: string
  plan: 'Starter' | 'Growth' | 'Professional'
  studentCount: number
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'
  mrr: number
  joinedAt: string
  renewsAt: string
}

export interface SubscriptionPlan {
  id: string
  name: 'Starter' | 'Growth' | 'Professional'
  pricePerMonth: number
  studentLimit: number // -1 = unlimited
  features: string[]
}

export interface PlatformInvoice {
  id: string
  invoiceNo: string
  instituteId: string
  amount: number
  period: string
  status: 'PAID' | 'DUE' | 'FAILED'
  issuedAt: string
}

export interface SupportTicket {
  id: string
  ticketNo: string
  instituteId: string
  subject: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  openedAt: string
}
