import React from 'react'
import { Card, EmptyState, PageHeader, StatCard, StatusBadge, Table, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { attendanceSummary } from '../../lib/selectors'

export default function MyAttendance() {
  const { student } = useMyStudent()
  if (!student) return <EmptyState title="No student linked to this login" />
  const att = attendanceSummary(student.id)

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Your class-by-class attendance record." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Overall" value={`${att.percent}%`} tone={att.percent < 75 ? 'warn' : 'good'} />
        <StatCard label="Present" value={String(att.present)} tone="good" />
        <StatCard label="Late" value={String(att.late)} />
        <StatCard label="Absent" value={String(att.absent)} tone={att.absent ? 'danger' : 'default'} />
      </div>
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
