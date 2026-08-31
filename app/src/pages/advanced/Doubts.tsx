import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Badge, Button, Card, EmptyState, Field, PageHeader, Select, inputCls } from '../../components/ui'
import { COLLECTIONS, getAll } from '../../lib/db'
import type { Subject } from '../../lib/types'

interface Doubt {
  id: string
  subject: string
  question: string
  status: 'OPEN' | 'ANSWERED'
  answer?: string
  by: string
}

const SEED: Doubt[] = [
  { id: 'd1', subject: 'Physics', question: 'Why does the normal force do no work on a block on an incline?', status: 'ANSWERED', answer: 'Because it is perpendicular to the displacement — W = F·d·cosθ with θ = 90°.', by: 'Riya Sen' },
  { id: 'd2', subject: 'Chemistry', question: 'How to decide hybridisation quickly for XeF4?', status: 'OPEN', by: 'Aarav Gupta' }
]

export default function Doubts() {
  const { role } = useAuth()
  const subjects = getAll<Subject>(COLLECTIONS.subjects)
  const [doubts, setDoubts] = useState<Doubt[]>(SEED)
  const [subject, setSubject] = useState(subjects[0]?.name ?? 'Physics')
  const [question, setQuestion] = useState('')

  const ask = () => {
    setDoubts([{ id: `d${Date.now()}`, subject, question, status: 'OPEN', by: 'You' }, ...doubts])
    setQuestion('')
  }
  const answer = (id: string, text: string) =>
    setDoubts(doubts.map((d) => (d.id === id ? { ...d, status: 'ANSWERED', answer: text } : d)))

  const isTeacher = role?.portal === 'ADMIN'

  return (
    <div>
      <PageHeader title="Doubt Box" subtitle="Students post subject doubts; teachers answer and close them (Phase 2 preview)." />

      {!isTeacher && (
        <Card className="p-4 mb-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Subject">
              <Select value={subject} onChange={setSubject}>
                {subjects.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Your doubt">
                <input className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value)} />
              </Field>
            </div>
          </div>
          <Button onClick={ask} disabled={!question.trim()}>
            Post doubt
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {doubts.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center justify-between">
              <Badge tone="indigo">{d.subject}</Badge>
              <Badge tone={d.status === 'OPEN' ? 'amber' : 'green'}>{d.status}</Badge>
            </div>
            <p className="text-sm font-medium text-slate-800 mt-2">{d.question}</p>
            <p className="text-xs text-slate-400">asked by {d.by}</p>
            {d.answer && <p className="text-sm text-slate-600 mt-2 border-l-2 border-brand-400 pl-2">{d.answer}</p>}
            {isTeacher && d.status === 'OPEN' && (
              <AnswerBox onAnswer={(t) => answer(d.id, t)} />
            )}
          </Card>
        ))}
        {doubts.length === 0 && <EmptyState title="No doubts yet" />}
      </div>
    </div>
  )
}

function AnswerBox({ onAnswer }: { onAnswer: (t: string) => void }) {
  const [t, setT] = useState('')
  return (
    <div className="flex gap-2 mt-3">
      <input className={inputCls} placeholder="Type an answer…" value={t} onChange={(e) => setT(e.target.value)} />
      <Button size="sm" onClick={() => t.trim() && onAnswer(t)}>
        Answer
      </Button>
    </div>
  )
}
