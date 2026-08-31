import React, { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatusBadge,
  Table,
  Tabs,
  currency,
  fmtDate,
  inputCls
} from '../../components/ui'
import { attendanceSummary, feeSummary, studentResults } from '../../lib/selectors'
import type { Batch, Course, Guardian, Student, StudentDocument } from '../../lib/types'

const emptyForm = {
  name: '',
  gender: 'Male' as Student['gender'],
  dob: '',
  mobile: '',
  email: '',
  address: '',
  parentName: '',
  parentPhone: '',
  courseId: '',
  batchId: ''
}

export default function Students() {
  const { user, can } = useAuth()
  const [students, setStudents] = useState<Student[]>(() => getAll<Student>(COLLECTIONS.students))
  const courses = getAll<Course>(COLLECTIONS.courses)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const [q, setQ] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewing, setViewing] = useState<Student | null>(null)

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (batchFilter && s.batchId !== batchFilter) return false
        if (statusFilter && s.status !== statusFilter) return false
        return `${s.name} ${s.mobile} ${s.admissionNo} ${s.parentName}`.toLowerCase().includes(q.toLowerCase())
      }),
    [students, q, batchFilter, statusFilter]
  )

  const formCourseSubjects = courses.find((c) => c.id === form.courseId)?.subjectIds ?? []

  const saveStudent = () => {
    const course = courses.find((c) => c.id === form.courseId)
    const rec: Student = {
      id: genId('std'),
      admissionNo: `PCC-2024-${String(students.length + 1).padStart(3, '0')}`,
      photoUrl: '',
      subjectIds: course?.subjectIds ?? [],
      joiningDate: new Date().toISOString().slice(0, 10),
      expectedCompletion: new Date(Date.now() + (course?.durationMonths ?? 12) * 30 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...form
    }
    upsert(COLLECTIONS.students, rec)
    upsert<Guardian>(COLLECTIONS.guardians, {
      id: genId('grd'),
      studentId: rec.id,
      name: rec.parentName,
      relation: 'Father',
      phone: rec.parentPhone,
      email: '',
      occupation: ''
    })
    logAudit(user, 'Students', 'STUDENT_ADMITTED', rec.name, { entityId: rec.id })
    setStudents(getAll(COLLECTIONS.students))
    setAdding(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.filter((s) => s.status === 'ACTIVE').length} active · ${students.length} on roll`}
        actions={
          can('students', 'create') ? <Button onClick={() => setAdding(true)}>+ New Admission</Button> : undefined
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Search name, mobile, admission no…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={batchFilter} onChange={setBatchFilter} className="max-w-[200px]">
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} className="max-w-[160px]">
          <option value="">Any status</option>
          {['ACTIVE', 'INACTIVE', 'DROPPED', 'COMPLETED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      <Card>
        <Table columns={['Student', 'Batch', 'Joined', 'Fee Pending', 'Attendance', 'Status', '']}>
          {filtered.map((s) => {
            const fee = feeSummary(s.id)
            const att = attendanceSummary(s.id)
            return (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} />
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.admissionNo}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">{batches.find((b) => b.id === s.batchId)?.name ?? '—'}</td>
                <td className="py-2.5 px-3">{fmtDate(s.joiningDate)}</td>
                <td className="py-2.5 px-3">
                  {fee.pending > 0 ? <span className="text-red-600 font-medium">{currency(fee.pending)}</span> : <span className="text-slate-400">Clear</span>}
                </td>
                <td className="py-2.5 px-3 w-28">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={att.percent} tone={att.percent < 75 ? 'red' : att.percent < 85 ? 'amber' : 'green'} />
                    <span className="text-xs text-slate-500">{att.percent}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button className="text-xs text-brand-600 font-medium" onClick={() => setViewing(s)}>
                    Open
                  </button>
                </td>
              </tr>
            )
          })}
        </Table>
        {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No students match your filters.</p>}
      </Card>

      {viewing && <StudentDetail student={viewing} onClose={() => setViewing(null)} />}

      {adding && (
        <Modal title="New admission" onClose={() => setAdding(false)} wide>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Full name" required>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Mobile" required>
              <input className={inputCls} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(v) => setForm({ ...form, gender: v as Student['gender'] })}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date of birth">
              <input type="date" className={inputCls} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Parent / Guardian name" required>
              <input className={inputCls} value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
            </Field>
            <Field label="Parent phone" required>
              <input className={inputCls} value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
            </Field>
            <Field label="Course" required>
              <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v, batchId: '' })}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Batch" required>
              <Select value={form.batchId} onChange={(v) => setForm({ ...form, batchId: v })}>
                <option value="">Select batch</option>
                {batches
                  .filter((b) => !form.courseId || b.courseId === form.courseId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timing})
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          {formCourseSubjects.length > 0 && (
            <p className="text-xs text-slate-500 mb-3">
              Course fee:{' '}
              <span className="font-medium text-slate-700">
                {currency(courses.find((c) => c.id === form.courseId)?.totalFees ?? 0)}
              </span>{' '}
              · fee installments are generated automatically after admission.
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveStudent}
              disabled={!form.name || !form.mobile || !form.parentName || !form.parentPhone || !form.courseId || !form.batchId}
            >
              Admit Student
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StudentDetail({ student, onClose }: { student: Student; onClose: () => void }) {
  const [tab, setTab] = useState('Personal')
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const courses = getAll<Course>(COLLECTIONS.courses)
  const guardians = getAll<Guardian>(COLLECTIONS.guardians).filter((g) => g.studentId === student.id)
  const docs = getAll<StudentDocument>(COLLECTIONS.documents).filter((d) => d.studentId === student.id)
  const fee = feeSummary(student.id)
  const att = attendanceSummary(student.id)
  const res = studentResults(student.id)
  const batch = batches.find((b) => b.id === student.batchId)
  const course = courses.find((c) => c.id === student.courseId)

  return (
    <Modal title={student.name} onClose={onClose} wide>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={student.name} size={52} />
        <div>
          <p className="font-semibold text-slate-800">
            {student.name} <span className="text-xs font-normal text-slate-400">· {student.admissionNo}</span>
          </p>
          <p className="text-sm text-slate-500">
            {course?.name} · {batch?.name}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={student.status} />
        </div>
      </div>

      <Tabs tabs={['Personal', 'Academic', 'Fees', 'Attendance', 'Documents']} active={tab} onChange={setTab} />

      {tab === 'Personal' && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Info label="Mobile" value={student.mobile} />
          <Info label="Email" value={student.email} />
          <Info label="Gender" value={student.gender} />
          <Info label="Date of birth" value={fmtDate(student.dob)} />
          <Info label="Address" value={student.address} />
          <Info label="Parent" value={`${student.parentName} · ${student.parentPhone}`} />
          {guardians.map((g) => (
            <Info key={g.id} label={g.relation} value={`${g.name}${g.occupation ? ` · ${g.occupation}` : ''}`} />
          ))}
        </div>
      )}

      {tab === 'Academic' && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Info label="Course" value={course?.name ?? '—'} />
          <Info label="Batch" value={`${batch?.name ?? '—'} (${batch?.timing ?? ''})`} />
          <Info label="Subjects" value={student.subjectIds.length ? `${student.subjectIds.length} subjects` : '—'} />
          <Info label="Joined" value={fmtDate(student.joiningDate)} />
          <Info label="Expected completion" value={fmtDate(student.expectedCompletion)} />
          <Info label="Average test score" value={`${res.avg}%`} />
        </div>
      )}

      {tab === 'Fees' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <MiniStat label="Total" value={currency(fee.total)} />
            <MiniStat label="Paid" value={currency(fee.paid)} tone="text-emerald-600" />
            <MiniStat label="Pending" value={currency(fee.pending)} tone={fee.pending ? 'text-red-600' : 'text-slate-800'} />
          </div>
          <Table columns={['Installment', 'Due', 'Amount', 'Paid', 'Status']}>
            {fee.invoices.map((i) => (
              <tr key={i.id}>
                <td className="py-2 px-3">{i.title}</td>
                <td className="py-2 px-3">{fmtDate(i.dueDate)}</td>
                <td className="py-2 px-3">{currency(i.amount)}</td>
                <td className="py-2 px-3">{currency(i.paidAmount)}</td>
                <td className="py-2 px-3">
                  <StatusBadge status={i.status} />
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {tab === 'Attendance' && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-4 text-center">
            <MiniStat label="Overall" value={`${att.percent}%`} />
            <MiniStat label="Present" value={String(att.present)} tone="text-emerald-600" />
            <MiniStat label="Late" value={String(att.late)} tone="text-amber-600" />
            <MiniStat label="Absent" value={String(att.absent)} tone="text-red-600" />
          </div>
          <Table columns={['Date', 'Status']}>
            {att.records
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 12)
              .map((r) => (
                <tr key={r.id}>
                  <td className="py-2 px-3">{fmtDate(r.date)}</td>
                  <td className="py-2 px-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
          </Table>
        </div>
      )}

      {tab === 'Documents' && (
        <div>
          <Table columns={['Type', 'File', 'Uploaded']}>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="py-2 px-3">
                  <Badge tone="slate">{d.type}</Badge>
                </td>
                <td className="py-2 px-3 text-slate-600">{d.name}</td>
                <td className="py-2 px-3">{fmtDate(d.uploadedAt)}</td>
              </tr>
            ))}
          </Table>
          {docs.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No documents on file.</p>}
        </div>
      )}
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-slate-400">{label}:</span> <span className="text-slate-700">{value}</span>
    </p>
  )
}

function MiniStat({ label, value, tone = 'text-slate-800' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg py-2">
      <p className="text-[11px] text-slate-400 uppercase">{label}</p>
      <p className={`font-bold ${tone}`}>{value}</p>
    </div>
  )
}
