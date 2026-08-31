import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Avatar, Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, Tabs, currency, fmtDate, inputCls, pct } from '../../components/ui'
import type { Staff as StaffT, StaffAttendanceRecord } from '../../lib/types'

const empty = { name: '', role: 'Teacher' as StaffT['role'], phone: '', email: '', salary: 0, subjectsText: '' }

export default function Staff() {
  const { user, can } = useAuth()
  const [staff, setStaff] = useState<StaffT[]>(() => getAll<StaffT>(COLLECTIONS.staff))
  const attendance = getAll<StaffAttendanceRecord>(COLLECTIONS.staffAttendance)
  const [tab, setTab] = useState('Directory')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)

  const save = () => {
    const rec: StaffT = {
      id: genId('stf'),
      staffCode: `PCC-T${String(staff.length + 1).padStart(2, '0')}`,
      subjects: form.subjectsText ? form.subjectsText.split(',').map((s) => s.trim()) : [],
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      name: form.name,
      role: form.role,
      phone: form.phone,
      email: form.email,
      salary: form.salary
    }
    upsert(COLLECTIONS.staff, rec)
    logAudit(user, 'Staff', 'STAFF_ADDED', rec.name, { entityId: rec.id })
    setStaff(getAll(COLLECTIONS.staff))
    setAdding(false)
    setForm(empty)
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Teachers and front-desk team, with attendance."
        actions={can('staff', 'create') ? <Button onClick={() => setAdding(true)}>+ Add Staff</Button> : undefined}
      />
      <Tabs tabs={['Directory', 'Attendance']} active={tab} onChange={setTab} />

      {tab === 'Directory' && (
        <Card>
          <Table columns={['Name', 'Role', 'Subjects', 'Phone', 'Salary', 'Joined', 'Status']}>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} size={30} />
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.staffCode}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">{s.role}</td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {s.subjects.map((x) => (
                      <Badge key={x} tone="indigo">
                        {x}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3">{s.phone}</td>
                <td className="py-2.5 px-3">{currency(s.salary)}</td>
                <td className="py-2.5 px-3">{fmtDate(s.joiningDate)}</td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'Attendance' && (
        <Card>
          <Table columns={['Name', 'Role', 'Days', 'Present', 'Attendance %']}>
            {staff.map((s) => {
              const rs = attendance.filter((a) => a.staffId === s.id)
              const present = rs.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length
              return (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-3">{s.role}</td>
                  <td className="py-2.5 px-3">{rs.length}</td>
                  <td className="py-2.5 px-3">{present}</td>
                  <td className="py-2.5 px-3">{pct(present, rs.length)}%</td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}

      {adding && (
        <Modal title="Add staff" onClose={() => setAdding(false)}>
          <Field label="Name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select value={form.role} onChange={(v) => setForm({ ...form, role: v as StaffT['role'] })}>
                {['Teacher', 'Front Desk', 'Accountant', 'Center Head'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Monthly salary (₹)">
              <input type="number" className={inputCls} value={form.salary} onChange={(e) => setForm({ ...form, salary: +e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Subjects (comma separated codes)">
            <input className={inputCls} placeholder="PHY, MAT" value={form.subjectsText} onChange={(e) => setForm({ ...form, subjectsText: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name}>
              Add
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
