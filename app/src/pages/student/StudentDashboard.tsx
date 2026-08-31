import React from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, EmptyState, PageHeader, StatCard, StatusBadge, currency, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { attendanceSummary, feeSummary, studentResults, subjectName } from '../../lib/selectors'
import type { Assignment, Exam, Material, Submission } from '../../lib/types'

export default function StudentDashboard() {
  const { student, course, batch } = useMyStudent()
  if (!student) return <EmptyState title="No student linked to this login" />

  const att = attendanceSummary(student.id)
  const fee = feeSummary(student.id)
  const res = studentResults(student.id)
  const exams = getAll<Exam>(COLLECTIONS.exams).filter((e) => e.batchId === student.batchId && e.status === 'SCHEDULED')
  const assignments = getAll<Assignment>(COLLECTIONS.assignments).filter((a) => a.batchId === student.batchId)
  const submissions = getAll<Submission>(COLLECTIONS.submissions).filter((s) => s.studentId === student.id)
  const pendingHw = assignments.filter((a) => !submissions.some((s) => s.assignmentId === a.id))
  const materials = getAll<Material>(COLLECTIONS.materials).filter((m) => m.courseId === student.courseId)

  return (
    <div>
      <PageHeader title={`Hi ${student.name.split(' ')[0]}`} subtitle={`${course?.name} · ${batch?.name} · ${batch?.timing}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Attendance" value={`${att.percent}%`} tone={att.percent < 75 ? 'warn' : 'good'} />
        <StatCard label="Fees Due" value={currency(fee.pending)} tone={fee.pending ? 'danger' : 'good'} hint={fee.nextDue ? `next ${fmtDate(fee.nextDue.dueDate)}` : 'all clear'} />
        <StatCard label="Avg Test Score" value={`${res.avg}%`} />
        <StatCard label="Pending Homework" value={String(pendingHw.length)} tone={pendingHw.length ? 'warn' : 'default'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Upcoming tests</h3>
            <Link to="/me/results" className="text-xs text-brand-600 font-medium">
              Results →
            </Link>
          </div>
          {exams.length === 0 ? (
            <p className="text-sm text-slate-400">No tests scheduled.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {exams.map((e) => (
                <li key={e.id} className="flex justify-between">
                  <span className="text-slate-700">
                    {e.name} <span className="text-slate-400">· {subjectName(e.subjectId)}</span>
                  </span>
                  <span className="text-slate-400">{fmtDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Homework to do</h3>
            <Link to="/me/homework" className="text-xs text-brand-600 font-medium">
              All homework →
            </Link>
          </div>
          {pendingHw.length === 0 ? (
            <p className="text-sm text-slate-400">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pendingHw.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className="text-slate-700">{a.title}</span>
                  <span className="text-slate-400">due {fmtDate(a.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Fee status</h3>
          <Link to="/me/fees" className="text-xs text-brand-600 font-medium">
            Details →
          </Link>
        </div>
        <div className="space-y-1.5 text-sm">
          {fee.invoices.slice(0, 4).map((i) => (
            <div key={i.id} className="flex justify-between">
              <span className="text-slate-700">
                {i.title} <span className="text-slate-400">· due {fmtDate(i.dueDate)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">{currency(i.amount)}</span>
                <StatusBadge status={i.status} />
              </span>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-sm text-slate-400 mt-4">
        {materials.length} study materials available ·{' '}
        <Link to="/me/materials" className="text-brand-600">
          open library
        </Link>
      </p>
    </div>
  )
}
