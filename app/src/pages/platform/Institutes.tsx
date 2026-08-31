import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, Modal, PageHeader, Select, StatusBadge, Table, currency, fmtDate, inputCls } from '../../components/ui'
import type { Institute, SubscriptionPlan } from '../../lib/types'

const empty = { name: '', ownerName: '', city: '', phone: '', plan: 'Starter' as Institute['plan'] }

export default function Institutes() {
  const { user } = useAuth()
  const [institutes, setInstitutes] = useState<Institute[]>(() => getAll<Institute>(COLLECTIONS.institutes))
  const plans = getAll<SubscriptionPlan>(COLLECTIONS.subscriptions)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(empty)
  const [q, setQ] = useState('')

  const rows = institutes.filter((i) => `${i.name} ${i.city} ${i.ownerName}`.toLowerCase().includes(q.toLowerCase()))

  const save = () => {
    const plan = plans.find((p) => p.name === form.plan)!
    const rec: Institute = {
      id: genId('inst'),
      studentCount: 0,
      status: 'TRIAL',
      mrr: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
      renewsAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      ...form
    }
    upsert(COLLECTIONS.institutes, rec)
    logAudit(user, 'Platform', 'INSTITUTE_CREATED', rec.name, { entityId: rec.id })
    setInstitutes(getAll(COLLECTIONS.institutes))
    setAdding(false)
    setForm(empty)
  }

  const cycle = (i: Institute) => {
    const order: Institute['status'][] = ['TRIAL', 'ACTIVE', 'SUSPENDED']
    const next = order[(order.indexOf(i.status) + 1) % order.length]
    const price = plans.find((p) => p.name === i.plan)!.pricePerMonth
    upsert(COLLECTIONS.institutes, { ...i, status: next, mrr: next === 'SUSPENDED' ? 0 : price })
    setInstitutes(getAll(COLLECTIONS.institutes))
  }

  return (
    <div>
      <PageHeader
        title="Institutes"
        subtitle={`${institutes.length} coaching accounts`}
        actions={<Button onClick={() => setAdding(true)}>+ Onboard Institute</Button>}
      />
      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card>
        <Table columns={['Institute', 'Owner', 'City', 'Plan', 'Students', 'MRR', 'Renews', 'Status', '']}>
          {rows.map((i) => (
            <tr key={i.id} className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-800">
                {i.name}
                {i.id === 'inst_self' && <Badge tone="indigo">This demo</Badge>}
              </td>
              <td className="py-2.5 px-3">{i.ownerName}</td>
              <td className="py-2.5 px-3">{i.city}</td>
              <td className="py-2.5 px-3">
                <Badge tone="slate">{i.plan}</Badge>
              </td>
              <td className="py-2.5 px-3">{i.studentCount}</td>
              <td className="py-2.5 px-3">{currency(i.mrr)}</td>
              <td className="py-2.5 px-3">{fmtDate(i.renewsAt)}</td>
              <td className="py-2.5 px-3">
                <StatusBadge status={i.status} />
              </td>
              <td className="py-2.5 px-3 text-right">
                <button className="text-xs text-brand-600 font-medium" onClick={() => cycle(i)}>
                  Change
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {adding && (
        <Modal title="Onboard institute" onClose={() => setAdding(false)}>
          <Field label="Institute name" required>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner name" required>
              <input className={inputCls} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </Field>
            <Field label="City">
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Plan">
              <Select value={form.plan} onChange={(v) => setForm({ ...form, plan: v as Institute['plan'] })}>
                {plans.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.name || !form.ownerName}>
              Create (14-day trial)
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
