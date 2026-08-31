import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useModules } from '../context/ModuleContext'
import { Card, PageHeader, StatCard, Badge, StatusBadge, currency, fmtDate, pct } from '../components/ui'
import { batchName, subjectName } from '../lib/selectors'
import type { AttendanceRecord, Batch, Exam, FeeInvoice, Payment, Student, TimetableSlot } from '../lib/types'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const { user } = useAuth()
  const { isEnabled } = useModules()

  const students = getAll<Student>(COLLECTIONS.students)
  const invoices = getAll<FeeInvoice>(COLLECTIONS.feeInvoices)
  const payments = getAll<Payment>(COLLECTIONS.payments)
  const exams = getAll<Exam>(COLLECTIONS.exams)
  const attendance = getAll<AttendanceRecord>(COLLECTIONS.attendance)
  const timetable = getAll<TimetableSlot>(COLLECTIONS.timetable)
  const batches = getAll<Batch>(COLLECTIONS.batches)

  const active = students.filter((s) => s.status === 'ACTIVE')
  const collectedRecent = payments
    .filter((p) => Date.now() - new Date(p.paidAt).getTime() < 30 * 86400000)
    .reduce((s, p) => s + p.amount, 0)
  const pending = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0)
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length
  const newAdmissions = students.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 30 * 86400000).length

  const today = DOW[new Date().getDay()]
  const todayClasses = useMemo(
    () => timetable.filter((t) => t.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [timetable, today]
  )
  const upcomingExams = exams
    .filter((e) => e.status === 'SCHEDULED')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const last30 = attendance.filter((r) => Date.now() - new Date(r.date).getTime() < 30 * 86400000)
  const attendancePct = pct(last30.filter((r) => r.status !== 'ABSENT').length, last30.length)

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle="Snapshot of your coaching centre today."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Active Students" value={String(active.length)} hint={`${students.length} total on roll`} />
        <StatCard label="Collected (30d)" value={currency(collectedRecent)} tone="good" />
        <StatCard label="Pending Fees" value={currency(pending)} tone={pending ? 'warn' : 'default'} hint={`${overdueCount} overdue`} />
        <StatCard label="Attendance (30d)" value={`${attendancePct}%`} tone={attendancePct < 80 ? 'warn' : 'good'} />
        <StatCard label="Today's Classes" value={String(todayClasses.length)} />
        <StatCard label="Upcoming Exams" value={String(exams.filter((e) => e.status === 'SCHEDULED').length)} />
        <StatCard label="New Admissions (30d)" value={String(newAdmissions)} tone="good" />
        <StatCard label="Batches" value={String(batches.filter((b) => b.status === 'ACTIVE').length)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Today's classes · {today}</h3>
            <Link to="/timetable" className="text-xs text-brand-600 font-medium">
              Timetable →
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-slate-400">No classes scheduled today.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {todayClasses.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="text-slate-700">
                    {t.startTime}–{t.endTime} · {batchName(t.batchId)}
                  </span>
                  <Badge tone="indigo">{subjectName(t.subjectId)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Upcoming exams</h3>
            <Link to="/exams" className="text-xs text-brand-600 font-medium">
              All exams →
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcomingExams.map((e) => (
                <li key={e.id} className="flex items-center justify-between">
                  <span className="text-slate-700">{e.name}</span>
                  <span className="text-slate-400">{fmtDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 mt-5">
        <h3 className="font-semibold text-slate-800 mb-3">Fee dues needing attention</h3>
        <div className="space-y-2 text-sm">
          {invoices
            .filter((i) => i.status === 'OVERDUE')
            .slice(0, 6)
            .map((i) => {
              const s = students.find((x) => x.id === i.studentId)
              return (
                <div key={i.id} className="flex items-center justify-between">
                  <span className="text-slate-700">
                    {s?.name} <span className="text-slate-400">· {i.title}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">{currency(i.amount - i.paidAmount)}</span>
                    <StatusBadge status={i.status} />
                  </span>
                </div>
              )
            })}
          {overdueCount === 0 && <p className="text-slate-400">No overdue fees. 🎉</p>}
        </div>
        {isEnabled('fees') && (
          <Link to="/fees/dues" className="text-xs text-brand-600 font-medium mt-3 inline-block">
            Open due alerts →
          </Link>
        )}
      </Card>
    </div>
  )
}
