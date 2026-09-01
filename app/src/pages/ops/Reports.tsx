import React, { useMemo, useState } from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Avatar, Card, PageHeader, Select, StatCard, Table, Tabs, currency, monthKey, pct } from '../../components/ui'
import { attendanceSummary, batchName, studentResults } from '../../lib/selectors'
import { mockLeaderboard, medal, onlineExamsForBatch } from '../../lib/leaderboard'
import type { Batch, FeeInvoice, Payment, Student } from '../../lib/types'

export default function Reports() {
  const students = getAll<Student>(COLLECTIONS.students)
  const invoices = getAll<FeeInvoice>(COLLECTIONS.feeInvoices)
  const payments = getAll<Payment>(COLLECTIONS.payments)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const [tab, setTab] = useState('Financial')
  const [lbBatch, setLbBatch] = useState(batches[0]?.id ?? '')

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    payments.forEach((p) => map.set(monthKey(p.paidAt), (map.get(monthKey(p.paidAt)) ?? 0) + p.amount))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [payments])
  const maxMonth = Math.max(1, ...monthly.map(([, v]) => v))

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0)

  const active = students.filter((s) => s.status === 'ACTIVE')
  const dropouts = students.filter((s) => s.status === 'DROPPED')
  const newThisMonth = students.filter((s) => monthKey(s.createdAt) === monthKey(new Date()))

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Financial, student performance and coaching growth." />
      <Tabs tabs={['Financial', 'Students', 'Growth', 'Mock Leaderboard']} active={tab} onChange={setTab} />

      {tab === 'Financial' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <StatCard label="Total Revenue (billed)" value={currency(totalBilled)} />
            <StatCard label="Collected" value={currency(collected)} tone="good" />
            <StatCard label="Outstanding" value={currency(totalBilled - collected)} tone="warn" />
            <StatCard label="Collection Rate" value={`${pct(collected, totalBilled)}%`} />
          </div>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Monthly collection (last 6 months)</h3>
            <div className="space-y-2">
              {monthly.map(([m, v]) => (
                <div key={m} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-slate-500">{m}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full flex items-center justify-end pr-2 text-[10px] text-white" style={{ width: `${(v / maxMonth) * 100}%` }}>
                      {currency(v)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'Students' && (
        <Card>
          <Table columns={['Batch', 'Students', 'Avg Attendance %', 'Avg Test %']}>
            {batches.map((b) => {
              const roster = active.filter((s) => s.batchId === b.id)
              const avgAtt = roster.length ? Math.round(roster.reduce((s, st) => s + attendanceSummary(st.id).percent, 0) / roster.length) : 0
              const avgTest = roster.length ? Math.round(roster.reduce((s, st) => s + studentResults(st.id).avg, 0) / roster.length) : 0
              return (
                <tr key={b.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{b.name}</td>
                  <td className="py-2.5 px-3">{roster.length}</td>
                  <td className="py-2.5 px-3">{avgAtt}%</td>
                  <td className="py-2.5 px-3">{avgTest}%</td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}

      {tab === 'Growth' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <StatCard label="Active Students" value={String(active.length)} />
            <StatCard label="New This Month" value={String(newThisMonth.length)} tone="good" />
            <StatCard label="Dropouts" value={String(dropouts.length)} tone="danger" />
            <StatCard label="Retention" value={`${pct(active.length, active.length + dropouts.length)}%`} />
          </div>
          <Card>
            <Table columns={['Batch', 'Active', 'Dropped', 'Fill vs capacity']}>
              {batches.map((b) => {
                const roster = students.filter((s) => s.batchId === b.id)
                return (
                  <tr key={b.id}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{b.name}</td>
                    <td className="py-2.5 px-3">{roster.filter((s) => s.status === 'ACTIVE').length}</td>
                    <td className="py-2.5 px-3">{roster.filter((s) => s.status === 'DROPPED').length}</td>
                    <td className="py-2.5 px-3">
                      {roster.filter((s) => s.status === 'ACTIVE').length} / {b.capacity}
                    </td>
                  </tr>
                )
              })}
            </Table>
          </Card>
        </>
      )}

      {tab === 'Mock Leaderboard' && (
        <>
          <Select value={lbBatch} onChange={setLbBatch} className="max-w-[240px] mb-4">
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          {(() => {
            const board = mockLeaderboard(lbBatch)
            const testCount = onlineExamsForBatch(lbBatch).length
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                  <StatCard label="Online mock tests" value={String(testCount)} />
                  <StatCard label="Students ranked" value={String(board.length)} />
                  <StatCard label="Batch avg" value={`${board.length ? Math.round(board.reduce((s, r) => s + r.avgPct, 0) / board.length) : 0}%`} />
                  <StatCard label="Top score" value={board.length ? `${board[0].bestPct}%` : '—'} tone="good" />
                </div>
                <Card>
                  <Table columns={['Rank', 'Student', 'Tests', 'Avg %', 'Best %', 'Total']}>
                    {board.map((r) => (
                      <tr key={r.student.id} className={r.rank <= 3 ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{medal(r.rank) || `#${r.rank}`}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.student.name} size={28} />
                            <span className="font-medium text-slate-800">{r.student.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">{r.testsTaken}</td>
                        <td className="py-2.5 px-3 font-medium">{r.avgPct}%</td>
                        <td className="py-2.5 px-3">{r.bestPct}%</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {r.totalScore} / {r.totalMax}
                        </td>
                      </tr>
                    ))}
                  </Table>
                  {board.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No online mock attempts in this batch yet.</p>}
                </Card>
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}
