import React from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Badge, Card, PageHeader, StatCard, Table, currency } from '../../components/ui'
import { attendanceSummary, batchName, feeSummary, studentResults } from '../../lib/selectors'
import type { Student } from '../../lib/types'

// Heuristic "AI" scoring over the demo data — a stand-in for the Phase-2 model.
export default function AIInsights() {
  const students = getAll<Student>(COLLECTIONS.students).filter((s) => s.status === 'ACTIVE')

  const rows = students.map((s) => {
    const att = attendanceSummary(s.id).percent
    const test = studentResults(s.id).avg
    const fee = feeSummary(s.id)
    const perfRisk = Math.max(0, Math.round(100 - 0.5 * att - 0.5 * test))
    const feeRisk = Math.min(100, Math.round((fee.overdue.length ? 55 : 10) + (fee.pending / Math.max(1, fee.total)) * 60))
    return { s, att, test, perfRisk, feeRisk, pending: fee.pending }
  })

  const atRisk = rows.filter((r) => r.perfRisk >= 55)
  const feeAtRisk = rows.filter((r) => r.feeRisk >= 55)

  return (
    <div>
      <PageHeader title="AI Insights" subtitle="Performance prediction and fee-collection risk (heuristic preview of the Phase-2 model)." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Students Scored" value={String(rows.length)} />
        <StatCard label="Performance At-Risk" value={String(atRisk.length)} tone="danger" />
        <StatCard label="Fee Default Risk" value={String(feeAtRisk.length)} tone="warn" />
        <StatCard label="Projected Shortfall" value={currency(feeAtRisk.reduce((s, r) => s + r.pending, 0))} tone="warn" />
      </div>

      <Card>
        <Table columns={['Student', 'Batch', 'Attendance', 'Avg Test', 'Perf. risk', 'Fee risk', 'Suggested action']}>
          {rows
            .slice()
            .sort((a, b) => b.perfRisk + b.feeRisk - (a.perfRisk + a.feeRisk))
            .slice(0, 25)
            .map((r) => (
              <tr key={r.s.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{r.s.name}</td>
                <td className="py-2.5 px-3">{batchName(r.s.batchId)}</td>
                <td className="py-2.5 px-3">{r.att}%</td>
                <td className="py-2.5 px-3">{r.test}%</td>
                <td className="py-2.5 px-3">
                  <Badge tone={r.perfRisk >= 55 ? 'red' : r.perfRisk >= 35 ? 'amber' : 'green'}>{r.perfRisk}</Badge>
                </td>
                <td className="py-2.5 px-3">
                  <Badge tone={r.feeRisk >= 55 ? 'red' : r.feeRisk >= 35 ? 'amber' : 'green'}>{r.feeRisk}</Badge>
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {r.perfRisk >= 55 ? 'Call parent, add remedial class' : r.feeRisk >= 55 ? 'Send fee reminder + offer installment' : 'On track'}
                </td>
              </tr>
            ))}
        </Table>
      </Card>
    </div>
  )
}
