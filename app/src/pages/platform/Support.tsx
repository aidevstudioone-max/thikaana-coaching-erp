import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Card, PageHeader, Select, StatCard, StatusBadge, Table, Tabs, fmtDate } from '../../components/ui'
import type { Institute, SupportTicket } from '../../lib/types'

const NEXT: Record<SupportTicket['status'], SupportTicket['status']> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'OPEN'
}

export default function Support() {
  const { user } = useAuth()
  const institutes = getAll<Institute>(COLLECTIONS.institutes)
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getAll<SupportTicket>(COLLECTIONS.supportTickets))
  const [tab, setTab] = useState('Open')
  const nameOf = (id: string) => institutes.find((i) => i.id === id)?.name ?? '—'

  const advance = (t: SupportTicket) => {
    const next = { ...t, status: NEXT[t.status] }
    upsert(COLLECTIONS.supportTickets, next)
    setTickets(getAll(COLLECTIONS.supportTickets))
    logAudit(user, 'Support', 'TICKET_STATUS', `${t.ticketNo} → ${next.status}`)
  }

  const list = tickets.filter((t) => (tab === 'Open' ? t.status !== 'RESOLVED' : t.status === 'RESOLVED'))

  return (
    <div>
      <PageHeader title="Support Desk" subtitle="Tickets raised by coaching institutes." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Open" value={String(tickets.filter((t) => t.status === 'OPEN').length)} tone="warn" />
        <StatCard label="In Progress" value={String(tickets.filter((t) => t.status === 'IN_PROGRESS').length)} />
        <StatCard label="Resolved" value={String(tickets.filter((t) => t.status === 'RESOLVED').length)} tone="good" />
        <StatCard label="High Priority" value={String(tickets.filter((t) => t.priority === 'High' && t.status !== 'RESOLVED').length)} tone="danger" />
      </div>
      <Tabs tabs={['Open', 'Resolved']} active={tab} onChange={setTab} />
      <Card>
        <Table columns={['Ticket', 'Institute', 'Subject', 'Priority', 'Opened', 'Status', '']}>
          {list.map((t) => (
            <tr key={t.id}>
              <td className="py-2.5 px-3 font-medium text-slate-800">{t.ticketNo}</td>
              <td className="py-2.5 px-3">{nameOf(t.instituteId)}</td>
              <td className="py-2.5 px-3 text-slate-600">{t.subject}</td>
              <td className="py-2.5 px-3">
                <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'slate'}>{t.priority}</Badge>
              </td>
              <td className="py-2.5 px-3">{fmtDate(t.openedAt)}</td>
              <td className="py-2.5 px-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="py-2.5 px-3 text-right">
                <button className="text-xs text-brand-600 font-medium" onClick={() => advance(t)}>
                  {t.status === 'OPEN' ? 'Start' : t.status === 'IN_PROGRESS' ? 'Resolve' : 'Reopen'}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
