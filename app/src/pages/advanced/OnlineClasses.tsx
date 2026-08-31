import React, { useState } from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Badge, Button, Card, PageHeader, Table, Toast, fmtDate } from '../../components/ui'
import { staffName, subjectName } from '../../lib/selectors'
import type { Batch, Material } from '../../lib/types'

export default function OnlineClasses() {
  const batches = getAll<Batch>(COLLECTIONS.batches).filter((b) => b.status === 'ACTIVE')
  const recordings = getAll<Material>(COLLECTIONS.materials).filter((m) => m.kind === 'Video')
  const [toast, setToast] = useState('')

  return (
    <div>
      <PageHeader title="Online Classes" subtitle="Live class links and the recorded-lecture library (Phase 2 preview)." />

      <h3 className="font-semibold text-slate-800 mb-2">Live rooms</h3>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {batches.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-800">{b.name}</h4>
              <Badge tone="slate">{b.timing}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">Room code: TCE-{b.id.slice(-4).toUpperCase()}</p>
            <Button size="sm" className="mt-3 w-full" onClick={() => setToast(`Live room for ${b.name} started (simulated).`)}>
              Start live class
            </Button>
          </Card>
        ))}
      </div>

      <h3 className="font-semibold text-slate-800 mb-2">Recorded lectures</h3>
      <Card>
        <Table columns={['Title', 'Subject', 'By', 'Size', 'Uploaded', 'Views']}>
          {recordings.map((r) => (
            <tr key={r.id}>
              <td className="py-2.5 px-3 font-medium text-slate-800">{r.title}</td>
              <td className="py-2.5 px-3">{subjectName(r.subjectId)}</td>
              <td className="py-2.5 px-3">{staffName(r.uploadedByStaffId)}</td>
              <td className="py-2.5 px-3">{r.sizeLabel}</td>
              <td className="py-2.5 px-3">{fmtDate(r.uploadedAt)}</td>
              <td className="py-2.5 px-3">{r.downloads}</td>
            </tr>
          ))}
        </Table>
        {recordings.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No recordings uploaded yet.</p>}
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
