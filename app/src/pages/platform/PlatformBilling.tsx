import React, { useMemo, useState } from 'react'
import { COLLECTIONS, getAll, upsert } from '../../lib/db'
import { Card, PageHeader, StatCard, StatusBadge, Table, currency, fmtDate, inputCls } from '../../components/ui'
import type { Institute, PlatformInvoice } from '../../lib/types'

export default function PlatformBilling() {
  const institutes = getAll<Institute>(COLLECTIONS.institutes)
  const [invoices, setInvoices] = useState<PlatformInvoice[]>(() => getAll<PlatformInvoice>(COLLECTIONS.platformInvoices))
  const [q, setQ] = useState('')
  const nameOf = (id: string) => institutes.find((i) => i.id === id)?.name ?? '—'

  const rows = useMemo(
    () =>
      invoices
        .slice()
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
        .filter((i) => `${i.invoiceNo} ${nameOf(i.instituteId)} ${i.period}`.toLowerCase().includes(q.toLowerCase())),
    [invoices, q]
  )

  const collected = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const due = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0)

  const markPaid = (inv: PlatformInvoice) => {
    upsert(COLLECTIONS.platformInvoices, { ...inv, status: 'PAID' })
    setInvoices(getAll(COLLECTIONS.platformInvoices))
  }

  return (
    <div>
      <PageHeader title="Platform Billing" subtitle="Invoices raised to coaching institutes for their subscription." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Collected (all time)" value={currency(collected)} tone="good" />
        <StatCard label="Outstanding" value={currency(due)} tone={due ? 'warn' : 'default'} />
        <StatCard label="Invoices" value={String(invoices.length)} />
        <StatCard label="Failed Charges" value={String(invoices.filter((i) => i.status === 'FAILED').length)} tone="danger" />
      </div>
      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Search invoice / institute…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card>
        <Table columns={['Invoice', 'Institute', 'Period', 'Amount', 'Issued', 'Status', '']}>
          {rows.map((i) => (
            <tr key={i.id}>
              <td className="py-2.5 px-3 font-medium text-slate-800">{i.invoiceNo}</td>
              <td className="py-2.5 px-3">{nameOf(i.instituteId)}</td>
              <td className="py-2.5 px-3">{i.period}</td>
              <td className="py-2.5 px-3">{currency(i.amount)}</td>
              <td className="py-2.5 px-3">{fmtDate(i.issuedAt)}</td>
              <td className="py-2.5 px-3">
                <StatusBadge status={i.status} />
              </td>
              <td className="py-2.5 px-3 text-right">
                {i.status !== 'PAID' && (
                  <button className="text-xs text-brand-600 font-medium" onClick={() => markPaid(i)}>
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
