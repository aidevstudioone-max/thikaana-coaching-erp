import React, { useState } from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, PageHeader, Select, Tabs } from '../../components/ui'
import { batchName, staffName, subjectName } from '../../lib/selectors'
import type { Batch, Staff, TimetableSlot } from '../../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Timetable() {
  const slots = getAll<TimetableSlot>(COLLECTIONS.timetable)
  const batches = getAll<Batch>(COLLECTIONS.batches).filter((b) => b.status === 'ACTIVE')
  const teachers = getAll<Staff>(COLLECTIONS.staff).filter((s) => s.role === 'Teacher' || s.role === 'Center Head')
  const [tab, setTab] = useState('By batch')
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '')
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '')

  const view = tab === 'By batch' ? slots.filter((s) => s.batchId === batchId) : slots.filter((s) => s.teacherStaffId === teacherId)

  return (
    <div>
      <PageHeader title="Timetable" subtitle="Weekly class schedule per batch and per teacher." />
      <Tabs tabs={['By batch', 'By teacher']} active={tab} onChange={setTab} />

      {tab === 'By batch' ? (
        <Select value={batchId} onChange={setBatchId} className="max-w-[220px] mb-4">
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      ) : (
        <Select value={teacherId} onChange={setTeacherId} className="max-w-[220px] mb-4">
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const daySlots = view.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
          if (daySlots.length === 0) return null
          return (
            <Card key={day} className="p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{day}</h3>
              <ul className="space-y-2">
                {daySlots.map((s) => (
                  <li key={s.id} className="text-sm border-l-2 border-brand-400 pl-2.5">
                    <p className="font-medium text-slate-700">
                      {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-slate-500">
                      {subjectName(s.subjectId)} · {s.room}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tab === 'By batch' ? staffName(s.teacherStaffId) : batchName(s.batchId)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
