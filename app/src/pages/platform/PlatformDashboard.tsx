import React from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, PageHeader, StatCard, StatusBadge, Table, currency, fmtDate } from '../../components/ui'
import type { Institute, PlatformInvoice, SubscriptionPlan, SupportTicket } from '../../lib/types'

export default function PlatformDashboard() {
  const institutes = getAll<Institute>(COLLECTIONS.institutes)
  const plans = getAll<SubscriptionPlan>(COLLECTIONS.subscriptions)
  const invoices = getAll<PlatformInvoice>(COLLECTIONS.platformInvoices)
  const tickets = getAll<SupportTicket>(COLLECTIONS.supportTickets)

  const mrr = institutes.reduce((s, i) => s + i.mrr, 0)
  const active = institutes.filter((i) => i.status === 'ACTIVE')
  const trial = institutes.filter((i) => i.status === 'TRIAL')
  const dueThisMonth = invoices.filter((i) => i.status === 'DUE').reduce((s, i) => s + i.amount, 0)
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED')

  return (
    <div>
      <PageHeader title="Thikaana Platform" subtitle="Every coaching account running on Thikaana Coaching ERP." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="MRR" value={currency(mrr)} tone="good" hint={`ARR ${currency(mrr * 12)}`} />
        <StatCard label="Active Institutes" value={String(active.length)} hint={`${trial.length} on trial`} />
        <StatCard label="Total Students" value={String(institutes.reduce((s, i) => s + i.studentCount, 0))} />
        <StatCard label="Invoices Due" value={currency(dueThisMonth)} tone={dueThisMonth ? 'warn' : 'default'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {plans.map((p) => {
          const count = institutes.filter((i) => i.plan === p.name).length
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <span className="text-lg font-bold text-brand-700">{currency(p.pricePerMonth)}/mo</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{count} institutes · {currency(count * p.pricePerMonth)} MRR</p>
              <p className="text-xs text-slate-400 mt-1">{p.studentLimit === -1 ? 'Unlimited students' : `Up to ${p.studentLimit} students`}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Renewals coming up</h3>
            <Link to="/platform/institutes" className="text-xs text-brand-600 font-medium">
              All institutes →
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            {institutes
              .slice()
              .sort((a, b) => a.renewsAt.localeCompare(b.renewsAt))
              .slice(0, 6)
              .map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-slate-700">{i.name}</span>
                  <span className="text-slate-400">
                    {i.plan} · {fmtDate(i.renewsAt)}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Open support tickets</h3>
            <Link to="/platform/support" className="text-xs text-brand-600 font-medium">
              Support desk →
            </Link>
          </div>
          <Table columns={['Ticket', 'Subject', 'Priority', 'Status']}>
            {openTickets.slice(0, 6).map((t) => (
              <tr key={t.id}>
                <td className="py-2 px-3 font-medium text-slate-800">{t.ticketNo}</td>
                <td className="py-2 px-3 text-slate-500">{t.subject}</td>
                <td className="py-2 px-3">{t.priority}</td>
                <td className="py-2 px-3">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  )
}
