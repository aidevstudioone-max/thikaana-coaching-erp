import React from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, EmptyState, PageHeader } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { staffName, subjectName } from '../../lib/selectors'
import type { TimetableSlot } from '../../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MyTimetable() {
  const { student, batch } = useMyStudent()
  if (!student) return <EmptyState title="No student linked to this login" />
  const slots = getAll<TimetableSlot>(COLLECTIONS.timetable).filter((s) => s.batchId === student.batchId)
  const today = DAYS[(new Date().getDay() + 6) % 7]

  return (
    <div>
      <PageHeader title="My Timetable" subtitle={`${batch?.name} · ${batch?.timing}`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
          if (daySlots.length === 0) return null
          return (
            <Card key={day} className={`p-4 ${day === today ? 'ring-2 ring-brand-400' : ''}`}>
              <h3 className="font-semibold text-slate-800 mb-2">
                {day} {day === today && <span className="text-xs text-brand-600">· today</span>}
              </h3>
              <ul className="space-y-2">
                {daySlots.map((s) => (
                  <li key={s.id} className="text-sm border-l-2 border-brand-400 pl-2.5">
                    <p className="font-medium text-slate-700">
                      {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-slate-500">{subjectName(s.subjectId)}</p>
                    <p className="text-xs text-slate-400">
                      {staffName(s.teacherStaffId)} · {s.room}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
      {slots.length === 0 && <EmptyState title="Timetable not published yet" />}
    </div>
  )
}
