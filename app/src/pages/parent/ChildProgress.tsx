import React from 'react'
import { Badge, Card, EmptyState, PageHeader, ProgressBar, StatCard, Table, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { examRanking, studentResults, subjectName } from '../../lib/selectors'

export default function ChildProgress() {
  const { student } = useMyStudent()
  if (!student) return <EmptyState title="No child linked to this login" />
  const { rows, avg } = studentResults(student.id)

  const bySubject = new Map<string, { sum: number; n: number }>()
  rows.forEach((r) => {
    const cur = bySubject.get(r.exam.subjectId) ?? { sum: 0, n: 0 }
    cur.sum += r.percent
    cur.n += 1
    bySubject.set(r.exam.subjectId, cur)
  })

  return (
    <div>
      <PageHeader title={`${student.name} · Progress`} subtitle="Test performance and subject-wise trend." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <StatCard label="Tests Taken" value={String(rows.length)} />
        <StatCard label="Average" value={`${avg}%`} tone={avg >= 60 ? 'good' : 'warn'} />
        <StatCard label="Trend" value={rows.length >= 2 ? (rows[0].percent >= rows[rows.length - 1].percent ? 'Improving' : 'Dipping') : '—'} />
      </div>

      <Card className="p-5 mb-5">
        <h3 className="font-semibold text-slate-800 mb-3">Subject-wise average</h3>
        <div className="space-y-2">
          {[...bySubject.entries()].map(([sid, v]) => (
            <div key={sid} className="flex items-center gap-3 text-sm">
              <span className="w-28 text-slate-600">{subjectName(sid)}</span>
              <div className="flex-1">
                <ProgressBar value={v.sum / v.n} tone={v.sum / v.n >= 60 ? 'green' : 'amber'} />
              </div>
              <span className="w-10 text-right text-slate-500">{Math.round(v.sum / v.n)}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Table columns={['Exam', 'Subject', 'Date', 'Marks', '%', 'Rank', 'Remark']}>
          {rows.map((r) => {
            const rank = examRanking(r.exam.id).find((x) => x.studentId === student.id)?.rank
            return (
              <tr key={r.result.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{r.exam.name}</td>
                <td className="py-2.5 px-3">{subjectName(r.exam.subjectId)}</td>
                <td className="py-2.5 px-3">{fmtDate(r.exam.date)}</td>
                <td className="py-2.5 px-3">
                  {r.result.marks}/{r.exam.maxMarks}
                </td>
                <td className="py-2.5 px-3">{r.percent}%</td>
                <td className="py-2.5 px-3">{rank ? `#${rank}` : '—'}</td>
                <td className="py-2.5 px-3">
                  <Badge tone={r.percent >= 60 ? 'green' : 'amber'}>{r.result.remark}</Badge>
                </td>
              </tr>
            )
          })}
        </Table>
        {rows.length === 0 && <EmptyState title="No results published yet" />}
      </Card>
    </div>
  )
}
