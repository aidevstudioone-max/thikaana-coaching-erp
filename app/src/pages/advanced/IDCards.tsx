import React, { useState } from 'react'
import { COLLECTIONS, getAll, load } from '../../lib/db'
import { Avatar, Button, Card, PageHeader, Select } from '../../components/ui'
import { batchName, courseName } from '../../lib/selectors'
import { fmtDate } from '../../lib/format'
import type { Organization, Student } from '../../lib/types'

export default function IDCards() {
  const students = getAll<Student>(COLLECTIONS.students).filter((s) => s.status === 'ACTIVE')
  const org = load<Organization>(COLLECTIONS.organization, {} as Organization)
  const [id, setId] = useState(students[0]?.id ?? '')
  const student = students.find((s) => s.id === id)

  return (
    <div>
      <PageHeader title="Student ID Cards" subtitle="Generate a printable ID card with a QR code (Phase 2 preview)." />
      <Select value={id} onChange={setId} className="max-w-xs mb-4">
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.admissionNo}
          </option>
        ))}
      </Select>

      {student && (
        <div id="print-area" className="max-w-sm">
          <Card className="overflow-hidden">
            <div className="bg-brand-700 text-white px-4 py-3 flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <div>
                <p className="font-bold text-sm leading-tight">{org.name}</p>
                <p className="text-[10px] text-brand-100">{org.tagline}</p>
              </div>
            </div>
            <div className="p-4 flex gap-4">
              <Avatar name={student.name} size={72} />
              <div className="text-sm">
                <p className="font-bold text-slate-900">{student.name}</p>
                <p className="text-slate-500 text-xs">{student.admissionNo}</p>
                <p className="text-slate-600 mt-1">{courseName(student.courseId)}</p>
                <p className="text-slate-500 text-xs">{batchName(student.batchId)}</p>
                <p className="text-slate-500 text-xs mt-1">Valid till {fmtDate(student.expectedCompletion)}</p>
              </div>
            </div>
            <div className="px-4 pb-4 flex items-end justify-between">
              <div
                className="w-16 h-16 grid grid-cols-4 grid-rows-4 gap-0.5"
                aria-label="QR code placeholder"
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`${(i * 7 + student.admissionNo.length) % 3 ? 'bg-slate-900' : 'bg-white'}`} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400">{org.phone}</p>
            </div>
          </Card>
          <Button variant="secondary" className="mt-3 no-print" onClick={() => window.print()}>
            Print card
          </Button>
        </div>
      )}
    </div>
  )
}
