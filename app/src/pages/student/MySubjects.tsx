import React from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, EmptyState, PageHeader } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { staffName } from '../../lib/selectors'
import type { Staff, Subject } from '../../lib/types'

export default function MySubjects() {
  const { student, course, batch } = useMyStudent()
  if (!student) return <EmptyState title="No student linked to this login" />
  const subjects = getAll<Subject>(COLLECTIONS.subjects).filter((s) => student.subjectIds.includes(s.id))
  const staff = getAll<Staff>(COLLECTIONS.staff)

  return (
    <div>
      <PageHeader title="My Subjects" subtitle={`${course?.name} · ${batch?.name}`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const teacher = staff.find((t) => t.subjects.includes(s.code))
          return (
            <Card key={s.id} className="p-5">
              <p className="text-xs text-slate-400">{s.code}</p>
              <h3 className="font-semibold text-slate-800">{s.name}</h3>
              <p className="text-sm text-slate-500 mt-2">👩‍🏫 {teacher ? teacher.name : staffName(batch?.teacherStaffId ?? '')}</p>
            </Card>
          )
        })}
      </div>
      {subjects.length === 0 && <EmptyState title="No subjects assigned" />}
    </div>
  )
}
