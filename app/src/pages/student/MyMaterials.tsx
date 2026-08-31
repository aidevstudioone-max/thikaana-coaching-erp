import React, { useState } from 'react'
import { COLLECTIONS, getAll, upsert } from '../../lib/db'
import { Badge, Card, EmptyState, PageHeader, Select, Toast } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { subjectName } from '../../lib/selectors'
import { fmtDate } from '../../lib/format'
import type { Material } from '../../lib/types'

export default function MyMaterials() {
  const { student } = useMyStudent()
  const [materials, setMaterials] = useState<Material[]>(() => getAll<Material>(COLLECTIONS.materials))
  const [subj, setSubj] = useState('')
  const [toast, setToast] = useState('')
  if (!student) return <EmptyState title="No student linked to this login" />

  const list = materials
    .filter((m) => m.courseId === student.courseId)
    .filter((m) => !subj || m.subjectId === subj)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  const subjectIds = [...new Set(materials.filter((m) => m.courseId === student.courseId).map((m) => m.subjectId))]

  const download = (m: Material) => {
    upsert(COLLECTIONS.materials, { ...m, downloads: m.downloads + 1 })
    setMaterials(getAll(COLLECTIONS.materials))
    setToast(`Downloading ${m.fileName} (simulated).`)
  }

  return (
    <div>
      <PageHeader title="Study Materials" subtitle="Notes, PDFs and video lectures shared by your teachers." />
      <Select value={subj} onChange={setSubj} className="max-w-xs mb-4">
        <option value="">All subjects</option>
        {subjectIds.map((s) => (
          <option key={s} value={s}>
            {subjectName(s)}
          </option>
        ))}
      </Select>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((m) => (
          <Card key={m.id} className="p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <Badge tone={m.kind === 'Video' ? 'blue' : 'indigo'}>{m.kind}</Badge>
              <span className="text-xs text-slate-400">{m.sizeLabel}</span>
            </div>
            <h3 className="font-medium text-slate-800 mt-2">{m.title}</h3>
            <p className="text-xs text-slate-400">
              {subjectName(m.subjectId)} · {fmtDate(m.uploadedAt)}
            </p>
            <button
              onClick={() => download(m)}
              className="mt-3 text-sm bg-brand-50 text-brand-700 rounded-lg px-3 py-2 hover:bg-brand-100"
            >
              {m.kind === 'Video' ? 'Watch' : 'Download'}
            </button>
          </Card>
        ))}
      </div>
      {list.length === 0 && <EmptyState title="No materials for this filter" />}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
