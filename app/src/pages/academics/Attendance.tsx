import React, { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, saveAll } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Avatar, Button, Card, PageHeader, ProgressBar, Select, StatusBadge, Table, Tabs, fmtDate, pct, todayISO } from '../../components/ui'
import type { AttendanceRecord, Batch, Student } from '../../lib/types'

const STATUSES: AttendanceRecord['status'][] = ['PRESENT', 'ABSENT', 'LATE']

export default function Attendance() {
  const { user, can } = useAuth()
  const editable = can('attendance', 'edit') || can('attendance', 'create')
  const batches = getAll<Batch>(COLLECTIONS.batches).filter((b) => b.status === 'ACTIVE')
  const students = getAll<Student>(COLLECTIONS.students)
  const [tab, setTab] = useState('Mark attendance')
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '')
  const [date, setDate] = useState(todayISO())
  const [records, setRecords] = useState<AttendanceRecord[]>(() => getAll<AttendanceRecord>(COLLECTIONS.attendance))

  const roster = students.filter((s) => s.batchId === batchId && s.status === 'ACTIVE')
  const dayRecords = records.filter((r) => r.batchId === batchId && r.date === date)
  const statusFor = (studentId: string) => dayRecords.find((r) => r.studentId === studentId)?.status

  const setStatus = (studentId: string, status: AttendanceRecord['status']) => {
    const others = records.filter((r) => !(r.batchId === batchId && r.date === date && r.studentId === studentId))
    const next: AttendanceRecord[] = [
      ...others,
      { id: genId('att'), batchId, studentId, date, status, markedByStaffId: user?.linkedStaffId ?? 'staff' }
    ]
    setRecords(next)
    saveAll(COLLECTIONS.attendance, next)
  }

  const markAll = (status: AttendanceRecord['status']) => {
    const others = records.filter((r) => !(r.batchId === batchId && r.date === date))
    const next = [
      ...others,
      ...roster.map((s) => ({
        id: genId('att'),
        batchId,
        studentId: s.id,
        date,
        status,
        markedByStaffId: user?.linkedStaffId ?? 'staff'
      }))
    ]
    setRecords(next)
    saveAll(COLLECTIONS.attendance, next)
    logAudit(user, 'Attendance', 'BULK_MARK', `${batches.find((b) => b.id === batchId)?.name} · ${date}`)
  }

  const report = useMemo(() => {
    const bRecords = records.filter((r) => r.batchId === batchId)
    return roster
      .map((s) => {
        const rs = bRecords.filter((r) => r.studentId === s.id)
        const present = rs.filter((r) => r.status !== 'ABSENT').length
        return { student: s, total: rs.length, present, percent: pct(present, rs.length) }
      })
      .sort((a, b) => a.percent - b.percent)
  }, [records, batchId, roster])

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark present / absent / late and review batch attendance." />

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={batchId} onChange={setBatchId} className="max-w-[220px]">
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        {tab === 'Mark attendance' && (
          <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        )}
      </div>

      <Tabs tabs={['Mark attendance', 'Report']} active={tab} onChange={setTab} />

      {tab === 'Mark attendance' && (
        <Card className="p-4">
          {editable && (
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant="secondary" onClick={() => markAll('PRESENT')}>
                Mark all present
              </Button>
              <Button size="sm" variant="ghost" onClick={() => markAll('ABSENT')}>
                Mark all absent
              </Button>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {roster.map((s) => {
              const cur = statusFor(s.id)
              return (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} size={32} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.admissionNo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        disabled={!editable}
                        onClick={() => setStatus(s.id, st)}
                        className={`text-xs rounded-lg px-2.5 py-1.5 border disabled:opacity-50 ${
                          cur === st
                            ? st === 'PRESENT'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : st === 'LATE'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {st[0] + st.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {roster.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No active students in this batch.</p>}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {dayRecords.length}/{roster.length} marked for {fmtDate(date)}
          </p>
        </Card>
      )}

      {tab === 'Report' && (
        <Card>
          <Table columns={['Student', 'Classes', 'Present', 'Attendance %', '']}>
            {report.map((r) => (
              <tr key={r.student.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{r.student.name}</td>
                <td className="py-2.5 px-3">{r.total}</td>
                <td className="py-2.5 px-3">{r.present}</td>
                <td className="py-2.5 px-3 w-40">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.percent} tone={r.percent < 75 ? 'red' : r.percent < 85 ? 'amber' : 'green'} />
                    <span className="text-xs text-slate-500">{r.percent}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">{r.percent < 75 && <StatusBadge status="LATE" />}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  )
}
