import React, { useMemo, useState } from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Badge, Card, Modal, PageHeader, Table, currency, fmtDateTime, inputCls } from '../../components/ui'
import Receipt from '../../components/Receipt'
import { ReceiptActions } from './CollectPayment'
import { staffName, studentName } from '../../lib/selectors'
import type { Payment } from '../../lib/types'

export default function Receipts() {
  const payments = getAll<Payment>(COLLECTIONS.payments)
  const [q, setQ] = useState('')
  const [viewing, setViewing] = useState<Payment | null>(null)

  const rows = useMemo(
    () =>
      payments
        .slice()
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
        .filter((p) => `${p.receiptNo} ${studentName(p.studentId)}`.toLowerCase().includes(q.toLowerCase())),
    [payments, q]
  )

  return (
    <div>
      <PageHeader title="Receipts" subtitle={`${payments.length} payments recorded · ${currency(payments.reduce((s, p) => s + p.amount, 0))} collected`} />
      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Search receipt no or student…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card>
        <Table columns={['Receipt', 'Student', 'Amount', 'Mode', 'Collected by', 'Date', 'Sent', '']}>
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-800">{p.receiptNo}</td>
              <td className="py-2.5 px-3">{studentName(p.studentId)}</td>
              <td className="py-2.5 px-3">{currency(p.amount)}</td>
              <td className="py-2.5 px-3">{p.mode}</td>
              <td className="py-2.5 px-3">{staffName(p.collectedByStaffId)}</td>
              <td className="py-2.5 px-3">{fmtDateTime(p.paidAt)}</td>
              <td className="py-2.5 px-3">
                <div className="flex gap-1">
                  {p.sentWhatsapp && <Badge tone="green">WA</Badge>}
                  {p.sentEmail && <Badge tone="blue">Email</Badge>}
                  {!p.sentWhatsapp && !p.sentEmail && <span className="text-xs text-slate-400">—</span>}
                </div>
              </td>
              <td className="py-2.5 px-3 text-right">
                <button className="text-xs text-brand-600 font-medium" onClick={() => setViewing(p)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {rows.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No receipts.</p>}
      </Card>

      {viewing && (
        <Modal title={`Receipt ${viewing.receiptNo}`} onClose={() => setViewing(null)}>
          <Receipt payment={viewing} />
          <ReceiptActions payment={viewing} />
        </Modal>
      )}
    </div>
  )
}
