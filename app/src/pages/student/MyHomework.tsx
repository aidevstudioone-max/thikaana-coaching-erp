import React, { useState } from 'react'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { Badge, Button, Card, EmptyState, PageHeader, StatusBadge, Table, Toast, fmtDate } from '../../components/ui'
import { useMyStudent } from '../../lib/portal'
import { subjectName } from '../../lib/selectors'
import type { Assignment, Submission } from '../../lib/types'

export default function MyHomework() {
  const { student } = useMyStudent()
  const [subs, setSubs] = useState<Submission[]>(() => getAll<Submission>(COLLECTIONS.submissions))
  const [toast, setToast] = useState('')
  if (!student) return <EmptyState title="No student linked to this login" />

  const assignments = getAll<Assignment>(COLLECTIONS.assignments)
    .filter((a) => a.batchId === student.batchId)
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))
  const mySub = (aid: string) => subs.find((s) => s.assignmentId === aid && s.studentId === student.id)

  const submit = (a: Assignment) => {
    const rec: Submission = {
      id: genId('sbm'),
      assignmentId: a.id,
      studentId: student.id,
      submittedAt: new Date().toISOString(),
      attachmentName: `${student.admissionNo}_answer.pdf`,
      status: new Date(a.dueDate) < new Date() ? 'LATE' : 'SUBMITTED',
      grade: ''
    }
    upsert(COLLECTIONS.submissions, rec)
    setSubs(getAll(COLLECTIONS.submissions))
    setToast(`Submitted "${a.title}" (file upload simulated).`)
  }

  return (
    <div>
      <PageHeader title="My Homework" subtitle="View assignments and submit your work." />
      <Card>
        <Table columns={['Title', 'Subject', 'Assigned', 'Due', 'Status', '']}>
          {assignments.map((a) => {
            const s = mySub(a.id)
            return (
              <tr key={a.id}>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.attachmentName}</p>
                </td>
                <td className="py-2.5 px-3">{subjectName(a.subjectId)}</td>
                <td className="py-2.5 px-3">{fmtDate(a.assignedDate)}</td>
                <td className="py-2.5 px-3">{fmtDate(a.dueDate)}</td>
                <td className="py-2.5 px-3">
                  {s ? <StatusBadge status={s.status} /> : <Badge tone="amber">Pending</Badge>}
                  {s?.grade && <span className="ml-2 text-xs text-slate-500">Grade {s.grade}</span>}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {!s && (
                    <Button size="sm" onClick={() => submit(a)}>
                      Submit
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
        {assignments.length === 0 && <EmptyState title="No homework assigned" />}
      </Card>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
