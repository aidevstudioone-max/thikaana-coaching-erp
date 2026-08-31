import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, ProgressBar, Select, inputCls } from '../../components/ui'
import { staffName } from '../../lib/selectors'
import type { Batch, Course, Staff, Student } from '../../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const empty = { name: '', courseId: '', timing: '', capacity: 30, teacherStaffId: '', room: '' }

export default function Batches() {
  const { user, can } = useAuth()
  const [batches, setBatches] = useState<Batch[]>(() => getAll<Batch>(COLLECTIONS.batches))
  const courses = getAll<Course>(COLLECTIONS.courses)
  const staff = getAll<Staff>(COLLECTIONS.staff).filter((s) => s.role === 'Teacher' || s.role === 'Center Head')
  const students = getAll<Student>(COLLECTIONS.students)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)
  const [days, setDays] = useState<string[]>(['Mon', 'Wed', 'Fri'])

  const save = () => {
    const rec: Batch = {
      id: genId('bat'),
      daysOfWeek: days,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...form
    }
    upsert(COLLECTIONS.batches, rec)
    logAudit(user, 'Batches', 'BATCH_CREATED', rec.name, { entityId: rec.id })
    setBatches(getAll(COLLECTIONS.batches))
    setAdding(false)
    setForm(empty)
  }

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle="Morning / evening / weekend batches with timings, capacity and a class teacher."
        actions={can('batches', 'create') ? <Button onClick={() => setAdding(true)}>+ New Batch</Button> : undefined}
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {batches.map((b) => {
          const filled = students.filter((s) => s.batchId === b.id && s.status === 'ACTIVE').length
          return (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{b.name}</h3>
                  <p className="text-xs text-slate-400">{courses.find((c) => c.id === b.courseId)?.name}</p>
                </div>
                <Badge tone="slate">{b.room}</Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2">🕑 {b.timing}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {b.daysOfWeek.map((d) => (
                  <span key={d} className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-2">👩‍🏫 {staffName(b.teacherStaffId)}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>
                    {filled} / {b.capacity} seats
                  </span>
                  <span>{Math.round((filled / b.capacity) * 100)}%</span>
                </div>
                <ProgressBar value={(filled / b.capacity) * 100} tone={filled >= b.capacity ? 'red' : 'brand'} />
              </div>
            </Card>
          )
        })}
      </div>

      {adding && (
        <Modal title="New batch" onClose={() => setAdding(false)}>
          <Field label="Batch name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Course" required>
            <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })}>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timing" required>
              <input
                className={inputCls}
                placeholder="17:00–20:00"
                value={form.timing}
                onChange={(e) => setForm({ ...form, timing: e.target.value })}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                className={inputCls}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
              />
            </Field>
          </div>
          <Field label="Days">
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const on = days.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                    className={`text-xs rounded-full px-2.5 py-1 border ${
                      on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class teacher" required>
              <Select value={form.teacherStaffId} onChange={(v) => setForm({ ...form, teacherStaffId: v })}>
                <option value="">Select</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Room">
              <input className={inputCls} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name || !form.courseId || !form.timing || !form.teacherStaffId}>
              Create
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
