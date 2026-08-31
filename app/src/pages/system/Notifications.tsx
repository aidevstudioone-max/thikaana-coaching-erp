import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll, saveAll } from '../../lib/db'
import { Badge, Button, Card, EmptyState, PageHeader, fmtDateTime } from '../../components/ui'
import type { Notification } from '../../lib/types'

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>(() => getAll<Notification>(COLLECTIONS.notifications))

  const mark = (id: string, read: boolean) => {
    const next = items.map((n) => (n.id === id ? { ...n, read } : n))
    setItems(next)
    saveAll(COLLECTIONS.notifications, next)
  }
  const markAll = () => {
    const next = items.map((n) => ({ ...n, read: true }))
    setItems(next)
    saveAll(COLLECTIONS.notifications, next)
  }

  const tone = (s: Notification['severity']) => (s === 'critical' ? 'red' : s === 'warning' ? 'amber' : 'blue')

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${items.filter((n) => !n.read).length} unread`}
        actions={<Button variant="secondary" size="sm" onClick={markAll}>Mark all read</Button>}
      />
      <Card>
        <div className="divide-y divide-slate-100">
          {items.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? 'opacity-60' : ''}`}>
              <Badge tone={tone(n.severity)}>{n.type}</Badge>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {fmtDateTime(n.ts)} · {n.channel}
                  {n.link && (
                    <>
                      {' · '}
                      <Link to={n.link} className="text-brand-600">
                        open
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <button className="text-xs text-slate-400 hover:text-slate-700" onClick={() => mark(n.id, !n.read)}>
                {n.read ? 'Unread' : 'Read'}
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && <EmptyState title="No notifications" />}
      </Card>
    </div>
  )
}
