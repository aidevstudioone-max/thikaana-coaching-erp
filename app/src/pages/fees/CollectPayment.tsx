import React, { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, currency, fmtDate, inputCls } from '../../components/ui'
import Receipt from '../../components/Receipt'
import { feeSummary } from '../../lib/selectors'
import type { FeeInvoice, Payment, Staff, Student } from '../../lib/types'

const MODES: Payment['mode'][] = ['Cash', 'UPI', 'Bank Transfer', 'Card']

export default function CollectPayment() {
  const { user } = useAuth()
  const students = getAll<Student>(COLLECTIONS.students).filter((s) => s.status !== 'DROPPED')
  const staff = getAll<Staff>(COLLECTIONS.staff)
  const [studentId, setStudentId] = useState('')
  const [q, setQ] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [amount, setAmount] = useState(0)
  const [mode, setMode] = useState<Payment['mode']>('UPI')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [, force] = useState(0)

  const matches = q
    ? students.filter((s) => `${s.name} ${s.admissionNo} ${s.mobile}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : []
  const student = students.find((s) => s.id === studentId)
  const summary = useMemo(() => (studentId ? feeSummary(studentId) : null), [studentId, receipt])
  const openInvoice = summary?.openInvoices.find((i) => i.id === invoiceId)

  const selectStudent = (s: Student) => {
    setStudentId(s.id)
    setQ('')
    const sum = feeSummary(s.id)
    const first = sum.openInvoices[0]
    setInvoiceId(first?.id ?? '')
    setAmount(first ? first.amount - first.paidAmount : 0)
  }

  const record = () => {
    if (!student || !openInvoice) return
    const collector = staff.find((x) => x.id === user?.linkedStaffId) ?? staff.find((x) => x.role === 'Accountant')!
    const count = getAll<Payment>(COLLECTIONS.payments).length
    const pay: Payment = {
      id: genId('pay'),
      receiptNo: `PCC/RCPT/${String(count + 1).padStart(4, '0')}`,
      invoiceId: openInvoice.id,
      studentId: student.id,
      amount,
      mode,
      reference,
      collectedByStaffId: collector.id,
      note,
      sentWhatsapp: false,
      sentEmail: false,
      paidAt: new Date().toISOString()
    }
    upsert(COLLECTIONS.payments, pay)
    const newPaid = openInvoice.paidAmount + amount
    const status: FeeInvoice['status'] = newPaid >= openInvoice.amount ? 'PAID' : 'PARTIAL'
    upsert<FeeInvoice>(COLLECTIONS.feeInvoices, { ...openInvoice, paidAmount: newPaid, status })
    logAudit(user, 'Fees', 'PAYMENT_COLLECTED', `${student.name} · ${currency(amount)}`, { entityId: pay.id })
    setReceipt(pay)
    force((n) => n + 1)
  }

  const resetAll = () => {
    setReceipt(null)
    setStudentId('')
    setInvoiceId('')
    setAmount(0)
    setReference('')
    setNote('')
  }

  return (
    <div>
      <PageHeader title="Collect Payment" subtitle="Record a fee payment and generate a receipt." />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          {!student ? (
            <Field label="Find student" required>
              <input
                className={inputCls}
                placeholder="Name, admission no or mobile…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              <div className="mt-2 divide-y divide-slate-100">
                {matches.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left py-2 text-sm hover:bg-slate-50 flex justify-between"
                  >
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <span className="text-slate-400">{s.admissionNo}</span>
                  </button>
                ))}
              </div>
            </Field>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.admissionNo}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={resetAll}>
                  Change
                </Button>
              </div>

              {summary && (
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-[11px] text-slate-400 uppercase">Total</p>
                    <p className="font-bold">{currency(summary.total)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-[11px] text-slate-400 uppercase">Paid</p>
                    <p className="font-bold text-emerald-600">{currency(summary.paid)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <p className="text-[11px] text-slate-400 uppercase">Pending</p>
                    <p className="font-bold text-red-600">{currency(summary.pending)}</p>
                  </div>
                </div>
              )}

              <Field label="Installment" required>
                <Select
                  value={invoiceId}
                  onChange={(v) => {
                    setInvoiceId(v)
                    const inv = summary?.openInvoices.find((i) => i.id === v)
                    setAmount(inv ? inv.amount - inv.paidAmount : 0)
                  }}
                >
                  <option value="">Select installment</option>
                  {summary?.openInvoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title} · due {fmtDate(i.dueDate)} · {currency(i.amount - i.paidAmount)} left
                    </option>
                  ))}
                </Select>
              </Field>

              {openInvoice && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount (₹)" required>
                      <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(+e.target.value)} />
                    </Field>
                    <Field label="Mode">
                      <Select value={mode} onChange={(v) => setMode(v as Payment['mode'])}>
                        {MODES.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Reference / txn id">
                    <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} />
                  </Field>
                  <Field label="Note">
                    <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
                  </Field>
                  <Button onClick={record} disabled={!amount || amount > openInvoice.amount - openInvoice.paidAmount} className="w-full">
                    Record {currency(amount)} & Generate Receipt
                  </Button>
                </>
              )}
            </>
          )}
        </Card>

        <Card className="p-5">
          {receipt ? (
            <div>
              <Receipt payment={receipt} />
              <ReceiptActions payment={receipt} />
              <Button variant="secondary" className="w-full mt-2" onClick={resetAll}>
                Collect another
              </Button>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-16 text-sm">
              <p>The generated receipt will appear here.</p>
              <p className="mt-1">You can print it or simulate a WhatsApp / email send.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export function ReceiptActions({ payment }: { payment: Payment }) {
  const [sent, setSent] = useState<string | null>(null)
  const send = (channel: 'WhatsApp' | 'Email') => {
    const key = channel === 'WhatsApp' ? 'sentWhatsapp' : 'sentEmail'
    upsert<Payment>(COLLECTIONS.payments, { ...payment, [key]: true } as Payment)
    setSent(channel)
  }
  return (
    <div className="mt-3 no-print">
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          Print / PDF
        </Button>
        <Button size="sm" variant="secondary" onClick={() => send('WhatsApp')}>
          Send WhatsApp
        </Button>
        <Button size="sm" variant="secondary" onClick={() => send('Email')}>
          Send Email
        </Button>
      </div>
      {sent && <p className="text-xs text-emerald-600 mt-2">Receipt {payment.receiptNo} sent via {sent} (simulated).</p>}
    </div>
  )
}
