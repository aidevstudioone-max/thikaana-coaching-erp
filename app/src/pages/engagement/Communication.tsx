import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, Field, PageHeader, Select, StatCard, StatusBadge, Table, Tabs, Toast, fmtDateTime, inputCls } from '../../components/ui'
import type { Batch, Message, Student } from '../../lib/types'

const TEMPLATES: Record<Message['category'], string> = {
  'Fee Reminder': 'Dear Parent, the fee installment for {student} is due on {date}. Please pay to avoid a late fee. — {sender}',
  'Attendance Alert': '{student} was marked absent today. Please ensure regular attendance. — {sender}',
  'Exam Notification': 'Reminder: {batch} test is scheduled soon. Syllabus and timing are on the portal. — {sender}',
  General: 'Notice from {sender}: '
}

export default function Communication() {
  const { user, can } = useAuth()
  const editable = can('communication', 'create')
  const batches = getAll<Batch>(COLLECTIONS.batches)
  const students = getAll<Student>(COLLECTIONS.students)
  const [messages, setMessages] = useState<Message[]>(() => getAll<Message>(COLLECTIONS.messages))
  const [tab, setTab] = useState('Compose')
  const [channel, setChannel] = useState<Message['channel']>('whatsapp')
  const [category, setCategory] = useState<Message['category']>('Fee Reminder')
  const [target, setTarget] = useState('all')
  const [body, setBody] = useState(TEMPLATES['Fee Reminder'])
  const [toast, setToast] = useState('')

  const recipientCount =
    target === 'all'
      ? students.filter((s) => s.status === 'ACTIVE').length
      : students.filter((s) => s.batchId === target && s.status === 'ACTIVE').length

  const send = () => {
    const msg: Message = {
      id: genId('msg'),
      ts: new Date().toISOString(),
      channel,
      category,
      audience: target === 'all' ? 'All active students' : `Batch: ${batches.find((b) => b.id === target)?.name}`,
      recipientCount,
      body,
      sentByUserId: user?.id ?? 'user',
      status: 'SENT'
    }
    upsert(COLLECTIONS.messages, msg)
    setMessages(getAll(COLLECTIONS.messages))
    logAudit(user, 'Communication', 'BROADCAST_SENT', `${category} · ${recipientCount} via ${channel}`)
    setToast(`${category} sent to ${recipientCount} recipients via ${channel} (simulated).`)
  }

  const sentThisMonth = messages.filter((m) => Date.now() - new Date(m.ts).getTime() < 30 * 86400000)

  return (
    <div>
      <PageHeader title="Communication Center" subtitle="WhatsApp / SMS / email for fees, attendance and exam notifications." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Messages (30d)" value={String(sentThisMonth.length)} />
        <StatCard label="Recipients (30d)" value={String(sentThisMonth.reduce((s, m) => s + m.recipientCount, 0))} />
        <StatCard label="WhatsApp" value={String(messages.filter((m) => m.channel === 'whatsapp').length)} />
        <StatCard label="Failed" value={String(messages.filter((m) => m.status === 'FAILED').length)} tone="danger" />
      </div>

      <Tabs tabs={['Compose', 'History']} active={tab} onChange={setTab} />

      {tab === 'Compose' && (
        <Card className="p-5 max-w-2xl">
          {!editable && <p className="text-sm text-amber-600 mb-3">Your role can view history but not send broadcasts.</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select value={channel} onChange={(v) => setChannel(v as Message['channel'])}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={category}
                onChange={(v) => {
                  setCategory(v as Message['category'])
                  setBody(TEMPLATES[v as Message['category']])
                }}
              >
                {Object.keys(TEMPLATES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Audience">
            <Select value={target} onChange={setTarget}>
              <option value="all">All active students ({students.filter((s) => s.status === 'ACTIVE').length})</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch: {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message">
            <textarea className={inputCls} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <p className="text-xs text-slate-400 mb-3">
            Placeholders {'{student} {date} {batch} {sender}'} are filled per recipient. Sending is simulated in this demo.
          </p>
          <Button onClick={send} disabled={!editable || !body.trim()}>
            Send to {recipientCount} recipients
          </Button>
        </Card>
      )}

      {tab === 'History' && (
        <Card>
          <Table columns={['When', 'Channel', 'Category', 'Audience', 'Recipients', 'Status']}>
            {messages
              .slice()
              .sort((a, b) => b.ts.localeCompare(a.ts))
              .map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-3">{fmtDateTime(m.ts)}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={m.channel === 'whatsapp' ? 'green' : m.channel === 'email' ? 'blue' : 'slate'}>{m.channel}</Badge>
                  </td>
                  <td className="py-2.5 px-3">{m.category}</td>
                  <td className="py-2.5 px-3 text-slate-500">{m.audience}</td>
                  <td className="py-2.5 px-3">{m.recipientCount}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
          </Table>
        </Card>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
