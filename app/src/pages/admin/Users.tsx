import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, inputCls } from '../../components/ui'
import type { Role, Staff, Student, User } from '../../lib/types'

export default function Users() {
  const { user, users, roles, refreshUsers } = useAuth()
  const staff = getAll<Staff>(COLLECTIONS.staff)
  const students = getAll<Student>(COLLECTIONS.students)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '', roleId: 'role_staff', linkId: '' })

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id

  const save = () => {
    const role = roles.find((r) => r.id === form.roleId)
    const rec: User = {
      id: genId('user'),
      name: form.name,
      username: form.username,
      email: `${form.username}@pathfinder.example`,
      mobile: '',
      password: form.password || 'demo123',
      roleId: form.roleId,
      linkedStaffId: role?.portal === 'ADMIN' ? form.linkId || undefined : undefined,
      linkedStudentId: role?.portal === 'STUDENT' || role?.portal === 'PARENT' ? form.linkId || undefined : undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
    upsert(COLLECTIONS.users, rec)
    logAudit(user, 'Users', 'USER_CREATED', `${rec.name} (${roleName(rec.roleId)})`, { entityId: rec.id })
    refreshUsers()
    setAdding(false)
    setForm({ name: '', username: '', password: '', roleId: 'role_staff', linkId: '' })
  }

  const toggleStatus = (u: User) => {
    upsert(COLLECTIONS.users, { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
    logAudit(user, 'Users', 'USER_STATUS_CHANGED', u.name, { entityId: u.id })
    refreshUsers()
  }

  const selectedRole = roles.find((r) => r.id === form.roleId)

  return (
    <div>
      <PageHeader title="Users" subtitle="Logins and the role each one carries." actions={<Button onClick={() => setAdding(true)}>+ New User</Button>} />
      <Card>
        <Table columns={['Name', 'Username', 'Role', 'Portal', 'Linked to', 'Status', '']}>
          {users.map((u) => {
            const r = roles.find((x) => x.id === u.roleId)
            const linked =
              staff.find((s) => s.id === u.linkedStaffId)?.name ?? students.find((s) => s.id === u.linkedStudentId)?.name ?? '—'
            return (
              <tr key={u.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{u.name}</td>
                <td className="py-2.5 px-3 text-slate-500">{u.username}</td>
                <td className="py-2.5 px-3">{roleName(u.roleId)}</td>
                <td className="py-2.5 px-3">
                  <Badge tone="slate">{r?.portal}</Badge>
                </td>
                <td className="py-2.5 px-3">{linked}</td>
                <td className="py-2.5 px-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button className="text-xs text-brand-600 font-medium" onClick={() => toggleStatus(u)}>
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {adding && (
        <Modal title="New user" onClose={() => setAdding(false)}>
          <Field label="Full name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" required>
              <input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Password">
              <input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="demo123" />
            </Field>
          </div>
          <Field label="Role" required>
            <Select value={form.roleId} onChange={(v) => setForm({ ...form, roleId: v, linkId: '' })}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          {selectedRole?.portal === 'ADMIN' && (
            <Field label="Link to staff member">
              <Select value={form.linkId} onChange={(v) => setForm({ ...form, linkId: v })}>
                <option value="">None</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.role}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {(selectedRole?.portal === 'STUDENT' || selectedRole?.portal === 'PARENT') && (
            <Field label="Link to student">
              <Select value={form.linkId} onChange={(v) => setForm({ ...form, linkId: v })}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.admissionNo}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name || !form.username}>
              Create
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
