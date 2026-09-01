import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, saveAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, Tabs, fmtDate, fmtDateTime, inputCls, pct, todayISO } from '../../components/ui'
import { batchName, courseName, examRanking, studentName, subjectName } from '../../lib/selectors'
import { attemptsFor, questionsFor } from '../../lib/exam'
import type { Batch, Course, Exam, ExamQuestion, ExamResult, Student, Subject } from '../../lib/types'

type QDraft = { text: string; options: string[]; correctIndex: number }
const blankQ = (): QDraft => ({ text: '', options: ['', '', '', ''], correctIndex: 0 })

const empty = {
  name: '',
  type: 'Weekly Test' as Exam['type'],
  courseId: '',
  batchId: '',
  subjectId: '',
  date: todayISO(),
  maxMarks: 50,
  mode: 'OFFLINE' as Exam['mode'],
  durationMinutes: 20,
  negativeMarks: 1,
  perQuestion: 4
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
  const [qs, setQs] = useState<QDraft[]>([blankQ(), blankQ()])
  const [marksFor, setMarksFor] = useState<Exam | null>(null)
  const [attemptsFor_, setAttemptsFor] = useState<Exam | null>(null)

  const list = exams
    .filter((e) => (tab === 'Scheduled' ? e.status === 'SCHEDULED' : e.status === 'COMPLETED'))
    .sort((a, b) => b.date.localeCompare(a.date))

  const isOnline = form.mode === 'ONLINE'
  const validQs = qs.filter((q) => q.text.trim() && q.options.every((o) => o.trim()))
  const onlineMax = validQs.length * form.perQuestion

  const resetForm = () => {
    setForm(empty)
    setQs([blankQ(), blankQ()])
  }

  const save = () => {
    const maxMarks = isOnline ? onlineMax : form.maxMarks
    const rec: Exam = {
      id: genId('exm'),
      name: form.name,
      type: form.type,
      courseId: form.courseId,
      batchId: form.batchId,
      subjectId: form.subjectId,
      date: form.date,
      maxMarks,
      mode: form.mode,
      durationMinutes: isOnline ? form.durationMinutes : 0,
      negativeMarks: isOnline ? form.negativeMarks : 0,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    }
    upsert(COLLECTIONS.exams, rec)
    if (isOnline) {
      const existing = getAll<ExamQuestion>(COLLECTIONS.examQuestions)
      const rows: ExamQuestion[] = validQs.map((q, i) => ({
        id: genId('eq'),
        examId: rec.id,
        order: i + 1,
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
        marks: form.perQuestion
      }))
      saveAll(COLLECTIONS.examQuestions, [...existing, ...rows])
    }
    logAudit(user, 'Exams', isOnline ? 'ONLINE_TEST_CREATED' : 'EXAM_CREATED', rec.name, { entityId: rec.id })
    setExams(getAll(COLLECTIONS.exams))
    setAdding(false)
    resetForm()
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
        subtitle="Pen-and-paper tests with marks entry, plus auto-graded online mock tests students attempt in their portal."
        actions={can('exams', 'create') ? <Button onClick={() => setAdding(true)}>+ New Exam</Button> : undefined}
      />
      <Tabs tabs={['Scheduled', 'Completed']} active={tab} onChange={setTab} />

      <Card>
        <Table columns={['Exam', 'Batch', 'Subject', 'Date', 'Max', tab === 'Completed' ? 'Avg %' : 'Status', '']}>
          {list.map((e) => {
            const online = e.mode === 'ONLINE'
            const rk = examRanking(e.id)
            const avg = rk.length ? Math.round(rk.reduce((s, r) => s + pct(Math.max(0, r.marks), e.maxMarks), 0) / rk.length) : 0
            const attempts = online ? attemptsFor(e.id).length : 0
            const roster = students.filter((s) => s.batchId === e.batchId && s.status === 'ACTIVE').length
            return (
              <tr key={e.id}>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-slate-800">{e.name}</p>
                  <p className="text-xs text-slate-400">
                    {e.type}
                    {online && ` · ${questionsFor(e.id).length} Q · ${e.durationMinutes}m · −${e.negativeMarks}`}
                  </p>
                </td>
                <td className="py-2.5 px-3">{batchName(e.batchId)}</td>
                <td className="py-2.5 px-3">{subjectName(e.subjectId)}</td>
                <td className="py-2.5 px-3">{fmtDate(e.date)}</td>
                <td className="py-2.5 px-3">{e.maxMarks}</td>
                <td className="py-2.5 px-3">
                  {tab === 'Completed' ? (
                    `${avg}%`
                  ) : online ? (
                    <Badge tone="indigo">Online · {attempts}/{roster} done</Badge>
                  ) : (
                    <StatusBadge status={e.status} />
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {online ? (
                    <button className="text-xs text-brand-600 font-medium" onClick={() => setAttemptsFor(e)}>
                      View attempts
                    </button>
                  ) : e.status === 'SCHEDULED' && can('exams', 'edit') ? (
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
        <Modal title="New exam" onClose={() => { setAdding(false); resetForm() }} wide={isOnline}>
          <div className="flex gap-2 mb-4">
            {(['OFFLINE', 'ONLINE'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setForm({ ...form, mode: m })}
                className={`text-sm rounded-lg px-3 py-2 border flex-1 ${
                  form.mode === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {m === 'OFFLINE' ? 'Pen & paper (enter marks)' : 'Online MCQ (auto-graded)'}
              </button>
            ))}
          </div>

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
            {!isOnline && (
              <Field label="Max marks">
                <input
                  type="number"
                  className={inputCls}
                  value={form.maxMarks}
                  onChange={(e) => setForm({ ...form, maxMarks: +e.target.value })}
                />
              </Field>
            )}
          </div>

          {isOnline && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Duration (min)">
                  <input type="number" className={inputCls} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} />
                </Field>
                <Field label="Marks / correct">
                  <input type="number" className={inputCls} value={form.perQuestion} onChange={(e) => setForm({ ...form, perQuestion: +e.target.value })} />
                </Field>
                <Field label="Negative / wrong">
                  <input type="number" className={inputCls} value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: +e.target.value })} />
                </Field>
              </div>

              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-500">
                  Questions ({validQs.length} valid · max {onlineMax} marks)
                </p>
                <Button size="sm" variant="secondary" onClick={() => setQs([...qs, blankQ()])}>
                  + Add question
                </Button>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {qs.map((q, qi) => (
                  <div key={qi} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-400 mt-2">{qi + 1}.</span>
                      <input
                        className={inputCls}
                        placeholder="Question text"
                        value={q.text}
                        onChange={(e) => setQs(qs.map((x, i) => (i === qi ? { ...x, text: e.target.value } : x)))}
                      />
                      {qs.length > 1 && (
                        <button className="text-slate-300 hover:text-red-500 text-lg leading-none mt-1" onClick={() => setQs(qs.filter((_, i) => i !== qi))}>
                          &times;
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pl-5">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() => setQs(qs.map((x, i) => (i === qi ? { ...x, correctIndex: oi } : x)))}
                          />
                          <input
                            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            value={opt}
                            onChange={(e) =>
                              setQs(qs.map((x, i) => (i === qi ? { ...x, options: x.options.map((o, k) => (k === oi ? e.target.value : o)) } : x)))
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5 mt-1">Select the radio next to the correct option.</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => { setAdding(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!form.name || !form.batchId || !form.subjectId || (isOnline && validQs.length === 0)}
            >
              {isOnline ? `Publish online test (${validQs.length} Q)` : 'Schedule'}
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

      {attemptsFor_ && <AttemptsModal exam={attemptsFor_} onClose={() => setAttemptsFor(null)} />}
    </div>
  )
}

function AttemptsModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const rows = examRanking(exam.id)
  const attempts = attemptsFor(exam.id)
  const byStudent = Object.fromEntries(attempts.map((a) => [a.studentId, a]))
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + pct(Math.max(0, r.marks), exam.maxMarks), 0) / rows.length) : 0

  return (
    <Modal title={`${exam.name} · attempts`} onClose={onClose} wide>
      <p className="text-sm text-slate-500 mb-3">
        {batchName(exam.batchId)} · {subjectName(exam.subjectId)} · {questionsFor(exam.id).length} questions · out of {exam.maxMarks} · class avg {avg}%
      </p>
      <Table columns={['Rank', 'Student', 'Score', '%', 'Correct', 'Wrong', 'Skipped', 'Submitted']}>
        {rows.map((r, i) => {
          const a = byStudent[r.studentId]
          return (
            <tr key={r.id}>
              <td className="py-2 px-3 text-slate-400">{i + 1}</td>
              <td className="py-2 px-3 font-medium text-slate-800">{r.student?.name ?? studentName(r.studentId)}</td>
              <td className="py-2 px-3">
                {r.marks} / {exam.maxMarks}
              </td>
              <td className="py-2 px-3">{pct(Math.max(0, r.marks), exam.maxMarks)}%</td>
              <td className="py-2 px-3 text-emerald-600">{a?.correctCount ?? '—'}</td>
              <td className="py-2 px-3 text-red-600">{a?.wrongCount ?? '—'}</td>
              <td className="py-2 px-3 text-slate-400">{a?.unattempted ?? '—'}</td>
              <td className="py-2 px-3 text-slate-500">{a ? fmtDateTime(a.submittedAt) + (a.autoSubmitted ? ' (auto)' : '') : '—'}</td>
            </tr>
          )
        })}
      </Table>
      {rows.length === 0 && <p className="text-center text-sm text-slate-400 py-6">No attempts yet.</p>}
    </Modal>
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
      <Table columns={['Rank', 'Student', 'Marks', '%', 'Remark']}>
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
