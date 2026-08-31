import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Avatar, Button, Card, PageHeader, StatCard, Table, Toast, currency, daysUntil, fmtDate } from '../../components/ui'
import { batchName } from '../../lib/selectors'
import type { FeeInvoice, Message, Student } from '../../lib/types'

type Bucket = 'Overdue' | 'Due today' | 'Due tomorrow' | 'Due this week'

function bucketOf(dueDate: string): Bucket | null {
  const d = daysUntil(dueDate)
  if (d < 0) return 'Overdue'
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  if (d <= 7) return 'Due this week'
  return null
}

export default function DueAlerts() {
  const { user } = useAuth()
  const students = getAll<Student>(COLLECTIONS.students)
  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => getAll<FeeInvoice>(COLLECTIONS.feeInvoices))
  const [toast, setToast] = useState('')

  const groups = useMemo(() => {
    const g: Record<Bucket, { inv: FeeInvoice; student?: Student }[]> = {
      Overdue: [],
      'Due today': [],
      'Due tomorrow': [],
      'Due this week': []
    }
    invoices
      .filter((i) => i.status !== 'PAID')
      .forEach((i) => {
        const b = bucketOf(i.dueDate)
        if (b) g[b].push({ inv: i, student: students.find((s) => s.id === i.studentId) })
      })
    ;(Object.keys(g) as Bucket[]).forEach((k) => g[k].sort((a, b) => a.inv.dueDate.localeCompare(b.inv.dueDate)))
    return g
  }, [invoices, students])

  const remindAll = (bucket: Bucket) => {
    const list = groups[bucket]
    if (!list.length) return
    const msg: Message = {
      id: genId('msg'),
      ts: new Date().toISOString(),
      channel: 'whatsapp',
      category: 'Fee Reminder',
      audience: `${bucket} — ${list.length} students`,
      recipientCount: list.length,
      body: `Fee reminder: your installment (${bucket.toLowerCase()}) is pending. Please pay at the earliest to avoid a late fee.`,
      sentByUserId: user?.id ?? 'user',
      status: 'SENT'
    }
    upsert(COLLECTIONS.messages, msg)
    logAudit(user, 'Communication', 'FEE_REMINDER_SENT', `${bucket} · ${list.length} recipients`)
    setToast(`WhatsApp reminder sent to ${list.length} ${bucket === 'Overdue' ? 'overdue' : 'upcoming'} students (simulated).`)
  }

  const buckets: Bucket[] = ['Overdue', 'Due today', 'Due tomorrow', 'Due this week']

  return (
    <div>
      <PageHeader
        title="Due Alerts"
        subtitle="Automatic buckets: overdue, due today, due tomorrow, due this week."
        actions={
          <Link to="/fees/collect" className="bg-brand-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-700">
            Collect Payment
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {buckets.map((b) => (
          <StatCard
            key={b}
            label={b}
            value={String(groups[b].length)}
            tone={b === 'Overdue' ? 'danger' : b === 'Due today' ? 'warn' : 'default'}
            hint={currency(groups[b].reduce((s, x) => s + (x.inv.amount - x.inv.paidAmount), 0))}
          />
        ))}
      </div>

      {buckets.map((b) =>
        groups[b].length ? (
          <Card key={b} className="mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                {b} <span className="text-slate-400 font-normal">· {groups[b].length}</span>
              </h3>
              <Button size="sm" variant="secondary" onClick={() => remindAll(b)}>
                Send WhatsApp reminder to all
              </Button>
            </div>
            <Table columns={['Student', 'Batch', 'Installment', 'Due', 'Amount', '']}>
              {groups[b].map(({ inv, student }) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student?.name ?? '?'} size={28} />
                      <div>
                        <p className="font-medium text-slate-800">{student?.name}</p>
                        <p className="text-xs text-slate-400">{student?.parentPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">{student ? batchName(student.batchId) : '—'}</td>
                  <td className="py-2.5 px-3">{inv.title}</td>
                  <td className="py-2.5 px-3">{fmtDate(inv.dueDate)}</td>
                  <td className="py-2.5 px-3 font-medium text-red-600">{currency(inv.amount - inv.paidAmount)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <Link to="/fees/collect" className="text-xs text-brand-600 font-medium">
                      Collect
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        ) : null
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
