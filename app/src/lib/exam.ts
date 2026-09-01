// Shared logic for ONLINE mock tests — grading and lookups used by both the
// student test-runner and the teacher's attempts view.

import { COLLECTIONS, getAll } from './db'
import type { Exam, ExamAttempt, ExamQuestion } from './types'

export function questionsFor(examId: string): ExamQuestion[] {
  return getAll<ExamQuestion>(COLLECTIONS.examQuestions)
    .filter((q) => q.examId === examId)
    .sort((a, b) => a.order - b.order)
}

export function attemptsFor(examId: string): ExamAttempt[] {
  return getAll<ExamAttempt>(COLLECTIONS.examAttempts).filter((a) => a.examId === examId)
}

export function studentAttempt(examId: string, studentId: string): ExamAttempt | undefined {
  return getAll<ExamAttempt>(COLLECTIONS.examAttempts).find((a) => a.examId === examId && a.studentId === studentId)
}

export interface GradeResult {
  score: number
  correctCount: number
  wrongCount: number
  unattempted: number
}

export function grade(exam: Exam, questions: ExamQuestion[], answers: Record<string, number>): GradeResult {
  let correctCount = 0
  let wrongCount = 0
  let unattempted = 0
  let score = 0
  for (const q of questions) {
    const a = answers[q.id]
    if (a === undefined || a === null) {
      unattempted++
      continue
    }
    if (a === q.correctIndex) {
      correctCount++
      score += q.marks
    } else {
      wrongCount++
      score -= exam.negativeMarks
    }
  }
  return { score, correctCount, wrongCount, unattempted }
}
