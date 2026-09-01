// Aggregate standings across every ONLINE mock test in a batch. Used by the
// student "Leaderboard" page and the teacher's Reports view.

import { COLLECTIONS, getAll } from './db'
import { pct } from './format'
import type { Exam, ExamAttempt, Student } from './types'

export interface LeaderRow {
  student: Student
  testsTaken: number
  totalScore: number
  totalMax: number
  avgPct: number
  bestPct: number
  rank: number
}

export function onlineExamsForBatch(batchId: string): Exam[] {
  return getAll<Exam>(COLLECTIONS.exams)
    .filter((e) => e.mode === 'ONLINE' && e.batchId === batchId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function mockLeaderboard(batchId: string): LeaderRow[] {
  const exams = onlineExamsForBatch(batchId)
  const maxById: Record<string, number> = Object.fromEntries(exams.map((e) => [e.id, e.maxMarks]))
  const ids = new Set(exams.map((e) => e.id))
  const attempts = getAll<ExamAttempt>(COLLECTIONS.examAttempts).filter((a) => ids.has(a.examId))
  const students = getAll<Student>(COLLECTIONS.students)

  const byStudent = new Map<string, ExamAttempt[]>()
  attempts.forEach((a) => {
    const arr = byStudent.get(a.studentId) ?? []
    arr.push(a)
    byStudent.set(a.studentId, arr)
  })

  const rows: Omit<LeaderRow, 'rank'>[] = []
  byStudent.forEach((atts, studentId) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return
    const pcts = atts.map((a) => pct(Math.max(0, a.score), maxById[a.examId] || 1))
    rows.push({
      student,
      testsTaken: atts.length,
      totalScore: atts.reduce((s, a) => s + Math.max(0, a.score), 0),
      totalMax: atts.reduce((s, a) => s + (maxById[a.examId] ?? 0), 0),
      avgPct: Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length),
      bestPct: Math.max(...pcts)
    })
  })

  return rows
    .sort((a, b) => b.avgPct - a.avgPct || b.testsTaken - a.testsTaken || b.totalScore - a.totalScore)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '')
