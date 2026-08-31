import React, { useMemo, useState } from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Badge, Card, EmptyState, PageHeader, Table, fmtDateTime, inputCls } from '../../components/ui'
import type { AuditLogEntry } from '../../lib/types'

export default function AuditLog() {
  const entries = getAll<AuditLogEntry>(COLLECTIONS.auditLog)
  const [q, setQ] = useState('')

  const rows = useMemo(
    () => entries.filter((e) => `${e.userName} ${e.module} ${e.action} ${e.entity}`.toLowerCase().includes(q.toLowerCase())),
    [entries, q]
  )

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every create / update / login recorded locally." />
      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card>
        <Table columns={['When', 'User', 'Module', 'Action', 'Entity']}>
          {rows.slice(0, 200).map((e) => (
            <tr key={e.id}>
              <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmtDateTime(e.ts)}</td>
              <td className="py-2 px-3">{e.userName}</td>
              <td className="py-2 px-3">
                <Badge tone="slate">{e.module}</Badge>
              </td>
              <td className="py-2 px-3 text-slate-600">{e.action}</td>
              <td className="py-2 px-3 text-slate-600">{e.entity}</td>
            </tr>
          ))}
        </Table>
        {rows.length === 0 && <EmptyState title="No audit entries yet" subtitle="Actions you take in the app will show up here." />}
      </Card>
    </div>
  )
}
