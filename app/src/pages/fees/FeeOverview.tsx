import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Avatar, Card, PageHeader, StatCard, StatusBadge, Table, currency, fmtDate, inputCls } from '../../components/ui'
import { feeSummary } from '../../lib/selectors'
import type { Batch, FeeInvoice, Student } from '../../lib/types'

export default function FeeOverview() {
  const students = getAll<Student>(COLLECTIONS.students).filter((s) => s.status !== 'DROPPED')
  const invoices = getAll<FeeInvoice>(COLLECTIONS.feeInvoices)
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('all')

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0)
  const overdueAmt = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + (i.amount - i.paidAmount), 0)

  const rows = useMemo(
    () =>
      students
        .map((s) => ({ student: s, ...feeSummary(s.id) }))
        .filter((r) => `${r.student.name} ${r.student.admissionNo}`.toLowerCase().includes(q.toLowerCase()))
        .filter((r) => (filter === 'pending' ? r.pending > 0 : filter === 'overdue' ? r.overdue.length > 0 : true))
        .sort((a, b) => b.pending - a.pending),
    [students, q, filter]
  )

  return (
    <div>
      <PageHeader
        title="Fee Overview"
        subtitle="Per-student totals, dues and next due date."
        actions={
          <Link to="/fees/collect" className="bg-brand-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-700">
            Collect Payment
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Total Billed" value={currency(totalBilled)} />
        <StatCard label="Collected" value={currency(totalPaid)} tone="good" />
        <StatCard label="Outstanding" value={currency(totalBilled - totalPaid)} tone="warn" />
        <StatCard label="Overdue" value={currency(overdueAmt)} tone="danger" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input className={`${inputCls} max-w-xs`} placeholder="Search student…" value={q} onChange={(e) => setQ(e.target.value)} />
        {(['all', 'pending', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm rounded-lg px-3 py-2 border ${
              filter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <Table columns={['Student', 'Batch', 'Total', 'Paid', 'Pending', 'Next Due', 'Status']}>
          {rows.map((r) => (
            <tr key={r.student.id} className="hover:bg-slate-50">
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.student.name} size={30} />
                  <div>
                    <p className="font-medium text-slate-800">{r.student.name}</p>
                    <p className="text-xs text-slate-400">{r.student.admissionNo}</p>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-3">{batches.find((b) => b.id === r.student.batchId)?.name ?? '—'}</td>
              <td className="py-2.5 px-3">{currency(r.total)}</td>
              <td className="py-2.5 px-3 text-emerald-600">{currency(r.paid)}</td>
              <td className="py-2.5 px-3 font-medium text-red-600">{r.pending > 0 ? currency(r.pending) : '—'}</td>
              <td className="py-2.5 px-3">{r.nextDue ? fmtDate(r.nextDue.dueDate) : '—'}</td>
              <td className="py-2.5 px-3">{r.nextDue ? <StatusBadge status={r.nextDue.status} /> : <StatusBadge status="PAID" />}</td>
            </tr>
          ))}
        </Table>
        {rows.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No students match.</p>}
      </Card>
    </div>
  )
}
