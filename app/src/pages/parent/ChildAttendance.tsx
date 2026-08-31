import React from 'react'
import { Card, EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge, Table, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { attendanceSummary } from '../../lib/selectors'

export default function ChildAttendance() {
  const { student } = useMyStudent()
  if (!student) return <EmptyState title="No child linked to this login" />
  const att = attendanceSummary(student.id)

  return (
    <div>
      <PageHeader title={`${student.name} · Attendance`} subtitle="Class-by-class record for the current term." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Overall" value={`${att.percent}%`} tone={att.percent < 75 ? 'warn' : 'good'} />
        <StatCard label="Present" value={String(att.present)} tone="good" />
        <StatCard label="Late" value={String(att.late)} />
        <StatCard label="Absent" value={String(att.absent)} tone={att.absent ? 'danger' : 'default'} />
      </div>
      <Card className="p-4 mb-4">
        <ProgressBar value={att.percent} tone={att.percent < 75 ? 'red' : att.percent < 85 ? 'amber' : 'green'} />
        {att.percent < 75 && <p className="text-xs text-red-600 mt-2">Attendance is below the 75% requirement. Please ensure regular classes.</p>}
      </Card>
      <Card>
        <Table columns={['Date', 'Status']}>
          {att.records
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 px-3">{fmtDate(r.date)}</td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
        </Table>
        {att.records.length === 0 && <EmptyState title="No attendance recorded yet" />}
      </Card>
    </div>
  )
}
