// Derived/computed reads shared by the admin app and the student/parent portals.
// These are pure functions over collections so they can move behind an API later.

import { COLLECTIONS, getAll } from './db'
import type {
  AttendanceRecord,
  Batch,
  Course,
  Exam,
  ExamResult,
  FeeInvoice,
  Staff,
  Student,
  Subject
} from './types'
import { pct } from './format'

export function feeSummary(studentId: string) {
  const invoices = getAll<FeeInvoice>(COLLECTIONS.feeInvoices).filter((i) => i.studentId === studentId)
  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const paid = invoices.reduce((s, i) => s + i.paidAmount, 0)
  const pending = total - paid
  const openInvoices = invoices
    .filter((i) => i.status !== 'PAID')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const nextDue = openInvoices[0]
  const overdue = invoices.filter((i) => i.status === 'OVERDUE')
  return { invoices, total, paid, pending, nextDue, overdue, openInvoices }
}

export function attendanceSummary(studentId: string, batchId?: string) {
  let records = getAll<AttendanceRecord>(COLLECTIONS.attendance).filter((r) => r.studentId === studentId)
  if (batchId) records = records.filter((r) => r.batchId === batchId)
  const present = records.filter((r) => r.status === 'PRESENT').length
  const late = records.filter((r) => r.status === 'LATE').length
  const absent = records.filter((r) => r.status === 'ABSENT').length
  const total = records.length
  const percent = pct(present + late, total)
  return { records, present, late, absent, total, percent }
}

export function studentResults(studentId: string) {
  const results = getAll<ExamResult>(COLLECTIONS.examResults).filter((r) => r.studentId === studentId)
  const exams = getAll<Exam>(COLLECTIONS.exams)
  const rows = results
    .map((r) => {
      const exam = exams.find((e) => e.id === r.examId)
      return exam ? { result: r, exam, percent: pct(r.marks, exam.maxMarks) } : null
    })
    .filter((x): x is { result: ExamResult; exam: Exam; percent: number } => !!x)
    .sort((a, b) => b.exam.date.localeCompare(a.exam.date))
  const avg = rows.length ? Math.round(rows.reduce((s, x) => s + x.percent, 0) / rows.length) : 0
  return { rows, avg }
}

export function examRanking(examId: string) {
  const results = getAll<ExamResult>(COLLECTIONS.examResults).filter((r) => r.examId === examId)
  const students = getAll<Student>(COLLECTIONS.students)
  return results
    .map((r) => ({ ...r, student: students.find((s) => s.id === r.studentId) }))
    .sort((a, b) => b.marks - a.marks)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export function batchName(id: string): string {
  return getAll<Batch>(COLLECTIONS.batches).find((b) => b.id === id)?.name ?? '—'
}

export function courseName(id: string): string {
  return getAll<Course>(COLLECTIONS.courses).find((c) => c.id === id)?.name ?? '—'
}

export function subjectName(id: string): string {
  return getAll<Subject>(COLLECTIONS.subjects).find((s) => s.id === id)?.name ?? '—'
}

export function staffName(id: string): string {
  return getAll<Staff>(COLLECTIONS.staff).find((s) => s.id === id)?.name ?? '—'
}

export function studentName(id: string): string {
  return getAll<Student>(COLLECTIONS.students).find((s) => s.id === id)?.name ?? '—'
}
