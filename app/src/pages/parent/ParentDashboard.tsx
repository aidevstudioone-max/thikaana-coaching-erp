import React from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Avatar, Card, EmptyState, PageHeader, StatCard, StatusBadge, currency, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { attendanceSummary, feeSummary, studentResults } from '../../lib/selectors'
import type { Exam } from '../../lib/types'

export default function ParentDashboard() {
  const { student, course, batch } = useMyStudent()
  if (!student) return <EmptyState title="No child linked to this login" />

  const att = attendanceSummary(student.id)
  const fee = feeSummary(student.id)
  const res = studentResults(student.id)
  const nextExam = getAll<Exam>(COLLECTIONS.exams)
    .filter((e) => e.batchId === student.batchId && e.status === 'SCHEDULED')
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div>
      <PageHeader title="Child Overview" subtitle="Fee status, attendance and academic progress at a glance." />
      <Card className="p-5 mb-5 flex items-center gap-4">
        <Avatar name={student.name} size={52} />
        <div>
          <p className="font-semibold text-slate-800">{student.name}</p>
          <p className="text-sm text-slate-500">
            {course?.name} · {batch?.name} · {batch?.timing}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={student.status} />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Attendance" value={`${att.percent}%`} tone={att.percent < 75 ? 'warn' : 'good'} />
        <StatCard label="Fees Pending" value={currency(fee.pending)} tone={fee.pending ? 'danger' : 'good'} />
        <StatCard label="Avg Test Score" value={`${res.avg}%`} tone={res.avg >= 60 ? 'good' : 'warn'} />
        <StatCard label="Next Test" value={nextExam ? fmtDate(nextExam.date) : '—'} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/child/fees" className="block">
          <Card className="p-4 hover:border-brand-300">
            <p className="font-medium text-slate-800">Fee Status →</p>
            <p className="text-xs text-slate-500 mt-1">Installments, dues and receipts</p>
          </Card>
        </Link>
        <Link to="/child/attendance" className="block">
          <Card className="p-4 hover:border-brand-300">
            <p className="font-medium text-slate-800">Attendance →</p>
            <p className="text-xs text-slate-500 mt-1">Day-by-day record</p>
          </Card>
        </Link>
        <Link to="/child/progress" className="block">
          <Card className="p-4 hover:border-brand-300">
            <p className="font-medium text-slate-800">Progress →</p>
            <p className="text-xs text-slate-500 mt-1">Test scores and subject analysis</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
