import { useAuth } from '../context/AuthContext'
import { COLLECTIONS, getAll } from './db'
import type { Batch, Course, Student } from './types'

// The student record the logged-in student/parent account is attached to.
export function useMyStudent(): { student?: Student; course?: Course; batch?: Batch } {
  const { user } = useAuth()
  const student = getAll<Student>(COLLECTIONS.students).find((s) => s.id === user?.linkedStudentId)
  const course = getAll<Course>(COLLECTIONS.courses).find((c) => c.id === student?.courseId)
  const batch = getAll<Batch>(COLLECTIONS.batches).find((b) => b.id === student?.batchId)
  return { student, course, batch }
}
