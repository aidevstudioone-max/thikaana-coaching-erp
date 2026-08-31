import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Table, currency, inputCls, Select } from '../../components/ui'
import { subjectName } from '../../lib/selectors'
import type { Batch, Course, Student, Subject } from '../../lib/types'

const empty = { name: '', category: 'Competitive' as Course['category'], durationMonths: 12, totalFees: 0 }

export default function Courses() {
  const { user, can } = useAuth()
  const [courses, setCourses] = useState<Course[]>(() => getAll<Course>(COLLECTIONS.courses))
  const subjects = getAll<Subject>(COLLECTIONS.subjects)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const students = getAll<Student>(COLLECTIONS.students)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)
  const [subIds, setSubIds] = useState<string[]>([])

  const save = () => {
    const rec: Course = {
      id: genId('crs'),
      subjectIds: subIds,
      teacherStaffIds: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...form
    }
    upsert(COLLECTIONS.courses, rec)
    logAudit(user, 'Courses', 'COURSE_CREATED', rec.name, { entityId: rec.id })
    setCourses(getAll(COLLECTIONS.courses))
    setAdding(false)
    setForm(empty)
    setSubIds([])
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Programs you offer, with fee structure and subjects."
        actions={can('courses', 'create') ? <Button onClick={() => setAdding(true)}>+ New Course</Button> : undefined}
      />
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => {
          const cnt = students.filter((s) => s.courseId === c.id && s.status === 'ACTIVE').length
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.category} · {c.durationMonths} months
                  </p>
                </div>
                <span className="text-lg font-bold text-brand-700">{currency(c.totalFees)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.subjectIds.map((s) => (
                  <Badge key={s} tone="indigo">
                    {subjectName(s)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                <span>{cnt} active students</span>
                <span>{batches.filter((b) => b.courseId === c.id).length} batches</span>
              </div>
            </Card>
          )
        })}
      </div>

      {adding && (
        <Modal title="New course" onClose={() => setAdding(false)}>
          <Field label="Course name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v as Course['category'] })}>
                {['Competitive', 'School', 'Skill'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Duration (months)">
              <input
                type="number"
                className={inputCls}
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: +e.target.value })}
              />
            </Field>
          </div>
          <Field label="Total fees (₹)" required>
            <input
              type="number"
              className={inputCls}
              value={form.totalFees}
              onChange={(e) => setForm({ ...form, totalFees: +e.target.value })}
            />
          </Field>
          <Field label="Subjects">
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const on = subIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubIds(on ? subIds.filter((x) => x !== s.id) : [...subIds, s.id])}
                    className={`text-xs rounded-full px-2.5 py-1 border ${
                      on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name || !form.totalFees}>
              Create
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
