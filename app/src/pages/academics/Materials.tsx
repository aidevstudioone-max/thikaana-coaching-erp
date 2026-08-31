import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, Table, fmtDate, inputCls } from '../../components/ui'
import { courseName, staffName, subjectName } from '../../lib/selectors'
import type { Course, Material, Subject } from '../../lib/types'

const empty = { title: '', courseId: '', subjectId: '', kind: 'PDF' as Material['kind'], fileName: '', sizeLabel: '' }

export default function Materials() {
  const { user, can } = useAuth()
  const [materials, setMaterials] = useState<Material[]>(() => getAll<Material>(COLLECTIONS.materials))
  const courses = getAll<Course>(COLLECTIONS.courses)
  const subjects = getAll<Subject>(COLLECTIONS.subjects)
  const [adding, setAdding] = useState(false)
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState(empty)

  const list = materials.filter((m) => !courseFilter || m.courseId === courseFilter)

  const save = () => {
    const rec: Material = {
      ...form,
      id: genId('mat'),
      fileName: form.fileName || `${form.title.toLowerCase().replace(/\s+/g, '_')}.${form.kind === 'Video' ? 'mp4' : 'pdf'}`,
      sizeLabel: form.sizeLabel || (form.kind === 'Video' ? '220 MB' : '1.4 MB'),
      uploadedByStaffId: user?.linkedStaffId ?? 'staff',
      uploadedAt: new Date().toISOString(),
      downloads: 0
    }
    upsert(COLLECTIONS.materials, rec)
    logAudit(user, 'Materials', 'MATERIAL_UPLOADED', rec.title, { entityId: rec.id })
    setMaterials(getAll(COLLECTIONS.materials))
    setAdding(false)
    setForm(empty)
  }

  return (
    <div>
      <PageHeader
        title="Study Materials"
        subtitle="Share PDFs, notes and video links — students download from their portal."
        actions={can('materials', 'create') ? <Button onClick={() => setAdding(true)}>+ Upload Material</Button> : undefined}
      />
      <Select value={courseFilter} onChange={setCourseFilter} className="max-w-[220px] mb-4">
        <option value="">All courses</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Card>
        <Table columns={['Title', 'Course', 'Subject', 'Type', 'Size', 'Uploaded by', 'Downloads']}>
          {list
            .slice()
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
            .map((m) => (
              <tr key={m.id}>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-slate-800">{m.title}</p>
                  <p className="text-xs text-slate-400">{m.fileName}</p>
                </td>
                <td className="py-2.5 px-3">{courseName(m.courseId)}</td>
                <td className="py-2.5 px-3">{subjectName(m.subjectId)}</td>
                <td className="py-2.5 px-3">
                  <Badge tone={m.kind === 'Video' ? 'blue' : 'indigo'}>{m.kind}</Badge>
                </td>
                <td className="py-2.5 px-3">{m.sizeLabel}</td>
                <td className="py-2.5 px-3">{staffName(m.uploadedByStaffId)}</td>
                <td className="py-2.5 px-3">{m.downloads}</td>
              </tr>
            ))}
        </Table>
      </Card>

      {adding && (
        <Modal title="Upload material" onClose={() => setAdding(false)}>
          <Field label="Title" required>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course" required>
              <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })}>
                <option value="">Select</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject" required>
              <Select value={form.subjectId} onChange={(v) => setForm({ ...form, subjectId: v })}>
                <option value="">Select</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.kind} onChange={(v) => setForm({ ...form, kind: v as Material['kind'] })}>
                {['PDF', 'Notes', 'Video', 'Assignment'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="File name">
              <input className={inputCls} value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs text-slate-400 mb-3">File upload is simulated in this demo — no file is stored.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.title || !form.courseId || !form.subjectId}>
              Upload
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
