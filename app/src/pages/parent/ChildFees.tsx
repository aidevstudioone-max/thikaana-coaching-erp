import React, { useState } from 'react'
import { COLLECTIONS, getAll, load } from '../../lib/db'
import { Button, Card, EmptyState, Modal, PageHeader, StatCard, StatusBadge, Table, currency, fmtDate } from '../../components/ui'
import Receipt from '../../components/Receipt'
import { useMyStudent } from '../../lib/portal'
import { feeSummary } from '../../lib/selectors'
import type { Organization, Payment } from '../../lib/types'

export default function ChildFees() {
  const { student } = useMyStudent()
  const org = load<Organization>(COLLECTIONS.organization, {} as Organization)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  if (!student) return <EmptyState title="No child linked to this login" />

  const fee = feeSummary(student.id)
  const payments = getAll<Payment>(COLLECTIONS.payments).filter((p) => p.studentId === student.id)

  return (
    <div>
      <PageHeader title={`${student.name} · Fees`} subtitle={`Pay via UPI: ${org.upiId || '—'}`} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total" value={currency(fee.total)} />
        <StatCard label="Paid" value={currency(fee.paid)} tone="good" />
        <StatCard label="Pending" value={currency(fee.pending)} tone={fee.pending ? 'danger' : 'good'} />
      </div>

      <Card className="mb-5">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Installments</div>
        <Table columns={['Installment', 'Due', 'Amount', 'Paid', 'Status']}>
          {fee.invoices.map((i) => (
            <tr key={i.id}>
              <td className="py-2.5 px-3">{i.title}</td>
              <td className="py-2.5 px-3">{fmtDate(i.dueDate)}</td>
              <td className="py-2.5 px-3">{currency(i.amount)}</td>
              <td className="py-2.5 px-3">{currency(i.paidAmount)}</td>
              <td className="py-2.5 px-3">
                <StatusBadge status={i.status} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card>
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">Receipts</div>
        <Table columns={['Receipt', 'Date', 'Amount', 'Mode', '']}>
          {payments
            .slice()
            .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
            .map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{p.receiptNo}</td>
                <td className="py-2.5 px-3">{fmtDate(p.paidAt)}</td>
                <td className="py-2.5 px-3">{currency(p.amount)}</td>
                <td className="py-2.5 px-3">{p.mode}</td>
                <td className="py-2.5 px-3 text-right">
                  <button className="text-xs text-brand-600 font-medium" onClick={() => setReceipt(p)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
        </Table>
        {payments.length === 0 && <EmptyState title="No payments yet" />}
      </Card>

      {receipt && (
        <Modal title={`Receipt ${receipt.receiptNo}`} onClose={() => setReceipt(null)}>
          <Receipt payment={receipt} />
          <div className="no-print mt-3">
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              Print / Save PDF
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
