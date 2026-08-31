import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, fmtDate, inputCls, pct, todayISO } from '../../components/ui'
import { batchName, subjectName } from '../../lib/selectors'
import type { Assignment, Batch, Student, Subject, Submission } from '../../lib/types'

const empty = { title: '', batchId: '', subjectId: '', description: '', attachmentName: '', dueDate: todayISO() }

export default function Homework() {
  const { user, can } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>(() => getAll<Assignment>(COLLECTIONS.assignments))
  const submissions = getAll<Submission>(COLLECTIONS.submissions)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const subjects = getAll<Subject>(COLLECTIONS.subjects)
  const students = getAll<Student>(COLLECTIONS.students)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)
  const [viewing, setViewing] = useState<Assignment | null>(null)

  const save = () => {
    const rec: Assignment = {
      ...form,
      id: genId('asn'),
      assignedDate: todayISO(),
      attachmentName: form.attachmentName || `worksheet_${Date.now()}.pdf`,
      createdByStaffId: user?.linkedStaffId ?? 'staff'
    }
    upsert(COLLECTIONS.assignments, rec)
    logAudit(user, 'Homework', 'ASSIGNMENT_CREATED', rec.title, { entityId: rec.id })
    setAssignments(getAll(COLLECTIONS.assignments))
    setAdding(false)
    setForm(empty)
  }

  return (
    <div>
      <PageHeader
        title="Homework & Assignments"
        subtitle="Assign work with attachments and track submissions."
        actions={can('homework', 'create') ? <Button onClick={() => setAdding(true)}>+ New Assignment</Button> : undefined}
      />
      <Card>
        <Table columns={['Title', 'Batch', 'Subject', 'Assigned', 'Due', 'Submissions', '']}>
          {assignments
            .slice()
            .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))
            .map((a) => {
              const subs = submissions.filter((s) => s.assignmentId === a.id)
              const roster = students.filter((s) => s.batchId === a.batchId && s.status === 'ACTIVE').length
              return (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{a.title}</td>
                  <td className="py-2.5 px-3">{batchName(a.batchId)}</td>
                  <td className="py-2.5 px-3">{subjectName(a.subjectId)}</td>
                  <td className="py-2.5 px-3">{fmtDate(a.assignedDate)}</td>
                  <td className="py-2.5 px-3">{fmtDate(a.dueDate)}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={subs.length >= roster ? 'green' : 'amber'}>
                      {subs.length}/{roster}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="text-xs text-brand-600 font-medium" onClick={() => setViewing(a)}>
                      Submissions
                    </button>
                  </td>
                </tr>
              )
            })}
        </Table>
      </Card>

      {adding && (
        <Modal title="New assignment" onClose={() => setAdding(false)}>
          <Field label="Title" required>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Batch" required>
              <Select value={form.batchId} onChange={(v) => setForm({ ...form, batchId: v })}>
                <option value="">Select</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject" required>
              <Select value={form.subjectId} onChange={(v) => setForm({ ...form, subjectId: v })}>
                <option value="">Select</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Instructions">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Attachment (name)">
              <input
                className={inputCls}
                placeholder="dpp_12.pdf"
                value={form.attachmentName}
                onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
              />
            </Field>
            <Field label="Due date">
              <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.title || !form.batchId || !form.subjectId}>
              Assign
            </Button>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} wide>
          <p className="text-sm text-slate-500 mb-3">
            {batchName(viewing.batchId)} · {subjectName(viewing.subjectId)} · due {fmtDate(viewing.dueDate)}
          </p>
          <Table columns={['Student', 'Submitted', 'File', 'Status', 'Grade']}>
            {students
              .filter((s) => s.batchId === viewing.batchId && s.status === 'ACTIVE')
              .map((s) => {
                const sub = submissions.find((x) => x.assignmentId === viewing.id && x.studentId === s.id)
                return (
                  <tr key={s.id}>
                    <td className="py-2 px-3 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 px-3">{sub ? fmtDate(sub.submittedAt) : '—'}</td>
                    <td className="py-2 px-3 text-slate-500">{sub?.attachmentName ?? '—'}</td>
                    <td className="py-2 px-3">{sub ? <StatusBadge status={sub.status} /> : <Badge tone="red">Not submitted</Badge>}</td>
                    <td className="py-2 px-3">{sub?.grade || '—'}</td>
                  </tr>
                )
              })}
          </Table>
        </Modal>
      )}
    </div>
  )
}
