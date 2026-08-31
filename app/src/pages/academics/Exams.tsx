import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, saveAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, Tabs, fmtDate, inputCls, pct, todayISO } from '../../components/ui'
import { batchName, courseName, examRanking, subjectName } from '../../lib/selectors'
import type { Batch, Course, Exam, ExamResult, Student, Subject } from '../../lib/types'

const empty = {
  name: '',
  type: 'Weekly Test' as Exam['type'],
  courseId: '',
  batchId: '',
  subjectId: '',
  date: todayISO(),
  maxMarks: 50
}

export default function Exams() {
  const { user, can } = useAuth()
  const [exams, setExams] = useState<Exam[]>(() => getAll<Exam>(COLLECTIONS.exams))
  const [results, setResults] = useState<ExamResult[]>(() => getAll<ExamResult>(COLLECTIONS.examResults))
  const courses = getAll<Course>(COLLECTIONS.courses)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const subjects = getAll<Subject>(COLLECTIONS.subjects)
  const students = getAll<Student>(COLLECTIONS.students)
  const [tab, setTab] = useState('Scheduled')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)
  const [marksFor, setMarksFor] = useState<Exam | null>(null)

  const list = exams
    .filter((e) => (tab === 'Scheduled' ? e.status === 'SCHEDULED' : e.status === 'COMPLETED'))
    .sort((a, b) => b.date.localeCompare(a.date))

  const save = () => {
    const rec: Exam = { id: genId('exm'), status: 'SCHEDULED', createdAt: new Date().toISOString(), ...form }
    upsert(COLLECTIONS.exams, rec)
    logAudit(user, 'Exams', 'EXAM_CREATED', rec.name, { entityId: rec.id })
    setExams(getAll(COLLECTIONS.exams))
    setAdding(false)
    setForm(empty)
  }

  const saveMarks = (exam: Exam, entered: Record<string, number>) => {
    const others = results.filter((r) => r.examId !== exam.id)
    const next: ExamResult[] = [
      ...others,
      ...Object.entries(entered)
        .filter(([, m]) => !isNaN(m))
        .map(([studentId, marks]) => ({
          id: genId('res'),
          examId: exam.id,
          studentId,
          marks,
          remark: pct(marks, exam.maxMarks) >= 60 ? 'Good' : 'Needs work'
        }))
    ]
    setResults(next)
    saveAll(COLLECTIONS.examResults, next)
    upsert(COLLECTIONS.exams, { ...exam, status: 'COMPLETED' })
    setExams(getAll(COLLECTIONS.exams))
    logAudit(user, 'Exams', 'MARKS_ENTERED', exam.name, { entityId: exam.id })
    setMarksFor(null)
  }

  return (
    <div>
      <PageHeader
        title="Exams & Results"
        subtitle="Weekly / mock / final tests, marks entry, ranks and subject analysis."
        actions={can('exams', 'create') ? <Button onClick={() => setAdding(true)}>+ Schedule Exam</Button> : undefined}
      />
      <Tabs tabs={['Scheduled', 'Completed']} active={tab} onChange={setTab} />

      <Card>
        <Table columns={['Exam', 'Batch', 'Subject', 'Date', 'Max', tab === 'Completed' ? 'Avg %' : 'Status', '']}>
          {list.map((e) => {
            const rk = examRanking(e.id)
            const avg = rk.length ? Math.round(rk.reduce((s, r) => s + pct(r.marks, e.maxMarks), 0) / rk.length) : 0
            return (
              <tr key={e.id}>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-slate-800">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.type}</p>
                </td>
                <td className="py-2.5 px-3">{batchName(e.batchId)}</td>
                <td className="py-2.5 px-3">{subjectName(e.subjectId)}</td>
                <td className="py-2.5 px-3">{fmtDate(e.date)}</td>
                <td className="py-2.5 px-3">{e.maxMarks}</td>
                <td className="py-2.5 px-3">{tab === 'Completed' ? `${avg}%` : <StatusBadge status={e.status} />}</td>
                <td className="py-2.5 px-3 text-right">
                  {e.status === 'SCHEDULED' && can('exams', 'edit') ? (
                    <button className="text-xs text-brand-600 font-medium" onClick={() => setMarksFor(e)}>
                      Enter marks
                    </button>
                  ) : (
                    <button className="text-xs text-brand-600 font-medium" onClick={() => setMarksFor(e)}>
                      View results
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
        {list.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Nothing here yet.</p>}
      </Card>

      {adding && (
        <Modal title="Schedule exam" onClose={() => setAdding(false)}>
          <Field label="Exam name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onChange={(v) => setForm({ ...form, type: v as Exam['type'] })}>
                {['Weekly Test', 'Mock Test', 'Monthly Test', 'Final Exam'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
          </div>
          <Field label="Batch" required>
            <Select
              value={form.batchId}
              onChange={(v) => {
                const b = batches.find((x) => x.id === v)
                setForm({ ...form, batchId: v, courseId: b?.courseId ?? '' })
              }}
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {courseName(b.courseId)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Max marks">
              <input
                type="number"
                className={inputCls}
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: +e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name || !form.batchId || !form.subjectId}>
              Schedule
            </Button>
          </div>
        </Modal>
      )}

      {marksFor && (
        <MarksModal
          exam={marksFor}
          roster={students.filter((s) => s.batchId === marksFor.batchId && s.status === 'ACTIVE')}
          existing={results.filter((r) => r.examId === marksFor.id)}
          canEdit={marksFor.status === 'SCHEDULED' && can('exams', 'edit')}
          onClose={() => setMarksFor(null)}
          onSave={saveMarks}
        />
      )}
    </div>
  )
}

function MarksModal({
  exam,
  roster,
  existing,
  canEdit,
  onClose,
  onSave
}: {
  exam: Exam
  roster: Student[]
  existing: ExamResult[]
  canEdit: boolean
  onClose: () => void
  onSave: (exam: Exam, entered: Record<string, number>) => void
}) {
  const [entered, setEntered] = useState<Record<string, number>>(
    Object.fromEntries(existing.map((r) => [r.studentId, r.marks]))
  )
  const ranked = [...roster]
    .map((s) => ({ s, m: entered[s.id] }))
    .sort((a, b) => (b.m ?? -1) - (a.m ?? -1))

  return (
    <Modal title={`${exam.name} · ${subjectName(exam.subjectId)}`} onClose={onClose} wide>
      <p className="text-sm text-slate-500 mb-3">
        {batchName(exam.batchId)} · {fmtDate(exam.date)} · out of {exam.maxMarks}
      </p>
      <Table columns={['Rank', 'Student', canEdit ? 'Marks' : 'Marks', '%', 'Remark']}>
        {ranked.map(({ s, m }, i) => (
          <tr key={s.id}>
            <td className="py-2 px-3 text-slate-400">{m != null ? i + 1 : '—'}</td>
            <td className="py-2 px-3 font-medium text-slate-800">{s.name}</td>
            <td className="py-2 px-3">
              {canEdit ? (
                <input
                  type="number"
                  className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
                  max={exam.maxMarks}
                  value={m ?? ''}
                  onChange={(e) => setEntered({ ...entered, [s.id]: +e.target.value })}
                />
              ) : (
                (m ?? '—')
              )}
            </td>
            <td className="py-2 px-3">{m != null ? `${pct(m, exam.maxMarks)}%` : '—'}</td>
            <td className="py-2 px-3">
              {m != null && <Badge tone={pct(m, exam.maxMarks) >= 60 ? 'green' : 'amber'}>{pct(m, exam.maxMarks) >= 60 ? 'Good' : 'Needs work'}</Badge>}
            </td>
          </tr>
        ))}
      </Table>
      {canEdit && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(exam, entered)}>Save marks & publish</Button>
        </div>
      )}
    </Modal>
  )
}
