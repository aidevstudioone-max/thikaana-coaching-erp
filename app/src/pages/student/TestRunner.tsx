import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, genId, getAll, upsert } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Badge, Button, Card, EmptyState, Modal, PageHeader, StatCard } from '../../components/ui'
import { pct } from '../../lib/format'
import { grade, questionsFor, studentAttempt } from '../../lib/exam'
import { subjectName, batchName, examRanking } from '../../lib/selectors'
import { useMyStudent } from '../../lib/portal'
import type { Exam, ExamAttempt, ExamResult } from '../../lib/types'

function clock(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TestRunner() {
  const { examId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { student } = useMyStudent()
  const exam = getAll<Exam>(COLLECTIONS.exams).find((e) => e.id === examId)
  const questions = useMemo(() => questionsFor(examId), [examId])

  const existing = student ? studentAttempt(examId, student.id) : undefined
  const [attempt, setAttempt] = useState<ExamAttempt | undefined>(existing)

  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const endsAtRef = useRef<number>(Date.now() + (exam?.durationMinutes ?? 20) * 60000)
  const [remaining, setRemaining] = useState<number>((exam?.durationMinutes ?? 20) * 60)

  const submit = (auto: boolean) => {
    if (!exam || !student || attempt) return
    const g = grade(exam, questions, answers)
    const rec: ExamAttempt = {
      id: genId('eatt'),
      examId: exam.id,
      studentId: student.id,
      answers,
      score: g.score,
      correctCount: g.correctCount,
      wrongCount: g.wrongCount,
      unattempted: g.unattempted,
      startedAt: new Date(endsAtRef.current - exam.durationMinutes * 60000).toISOString(),
      submittedAt: new Date().toISOString(),
      autoSubmitted: auto
    }
    upsert(COLLECTIONS.examAttempts, rec)
    upsert<ExamResult>(COLLECTIONS.examResults, {
      id: genId('res'),
      examId: exam.id,
      studentId: student.id,
      marks: g.score,
      remark:
        g.score / exam.maxMarks > 0.75
          ? 'Excellent'
          : g.score / exam.maxMarks > 0.5
          ? 'Good'
          : g.score / exam.maxMarks > 0.3
          ? 'Needs work'
          : 'Revise this topic'
    })
    logAudit(user, 'Exams', auto ? 'TEST_AUTO_SUBMITTED' : 'TEST_SUBMITTED', exam.name, { entityId: exam.id })
    setAttempt(rec)
  }

  // countdown
  useEffect(() => {
    if (attempt || !exam) return
    const t = setInterval(() => {
      const left = Math.round((endsAtRef.current - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(t)
        submit(true)
      }
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, exam, answers, questions])

  if (!student) return <EmptyState title="No student linked to this login" />
  if (!exam || exam.mode !== 'ONLINE') {
    return (
      <div>
        <PageHeader title="Test not found" />
        <Link to="/me/tests" className="text-brand-600 text-sm">
          ← Back to Mock Tests
        </Link>
      </div>
    )
  }

  // ---------- result view ----------
  if (attempt) {
    const rank = examRanking(exam.id).find((r) => r.studentId === student.id)?.rank
    const accuracy = pct(attempt.correctCount, attempt.correctCount + attempt.wrongCount)
    return (
      <div>
        <PageHeader
          title="Result"
          subtitle={`${exam.name} · ${subjectName(exam.subjectId)}`}
          actions={
            <Link to="/me/tests" className="bg-slate-100 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-200">
              Back to Mock Tests
            </Link>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Score" value={`${attempt.score} / ${exam.maxMarks}`} tone={attempt.score / exam.maxMarks >= 0.5 ? 'good' : 'warn'} />
          <StatCard label="Percentage" value={`${pct(Math.max(0, attempt.score), exam.maxMarks)}%`} />
          <StatCard label="Accuracy" value={`${accuracy}%`} />
          <StatCard label="Batch rank" value={rank ? `#${rank}` : '—'} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="bg-emerald-50 rounded-lg py-3">
            <p className="text-2xl font-bold text-emerald-600">{attempt.correctCount}</p>
            <p className="text-xs text-slate-500">Correct</p>
          </div>
          <div className="bg-red-50 rounded-lg py-3">
            <p className="text-2xl font-bold text-red-600">{attempt.wrongCount}</p>
            <p className="text-xs text-slate-500">Wrong {exam.negativeMarks > 0 ? `(−${exam.negativeMarks} each)` : ''}</p>
          </div>
          <div className="bg-slate-100 rounded-lg py-3">
            <p className="text-2xl font-bold text-slate-500">{attempt.unattempted}</p>
            <p className="text-xs text-slate-500">Skipped</p>
          </div>
        </div>

        <h3 className="font-semibold text-slate-800 mb-2">Review</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const picked = attempt.answers[q.id]
            const isCorrect = picked === q.correctIndex
            const skipped = picked === undefined
            return (
              <Card key={q.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800">
                    {i + 1}. {q.text}
                  </p>
                  <Badge tone={skipped ? 'slate' : isCorrect ? 'green' : 'red'}>{skipped ? 'Skipped' : isCorrect ? '+' + q.marks : '−' + exam.negativeMarks}</Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => {
                    const you = picked === oi
                    const right = q.correctIndex === oi
                    return (
                      <div
                        key={oi}
                        className={`text-sm rounded-md px-2.5 py-1.5 border ${
                          right
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : you
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                        {right && <span className="ml-2 text-xs font-medium">correct</span>}
                        {you && !right && <span className="ml-2 text-xs font-medium">your answer</span>}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- test-taking view ----------
  if (questions.length === 0) {
    return (
      <div>
        <PageHeader title={exam.name} />
        <p className="text-sm text-slate-400">This test has no questions yet.</p>
      </div>
    )
  }

  const q = questions[idx]
  const answeredCount = Object.keys(answers).length
  const low = remaining <= 60

  const setAns = (oi: number) => setAnswers((a) => ({ ...a, [q.id]: oi }))
  const clearAns = () =>
    setAnswers((a) => {
      const n = { ...a }
      delete n[q.id]
      return n
    })
  const toggleMark = () =>
    setMarked((m) => {
      const n = new Set(m)
      n.has(q.id) ? n.delete(q.id) : n.add(q.id)
      return n
    })

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{exam.name}</h1>
          <p className="text-xs text-slate-500">
            {subjectName(exam.subjectId)} · {batchName(exam.batchId)} · {questions.length} questions · +{q.marks} / −{exam.negativeMarks}
          </p>
        </div>
        <div className={`text-sm font-mono px-3 py-1.5 rounded-lg ${low ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
          ⏱ {clock(remaining)}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              Question {idx + 1} of {questions.length}
            </span>
            <button onClick={toggleMark} className={`text-xs rounded-full px-2.5 py-1 border ${marked.has(q.id) ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-slate-300 text-slate-500'}`}>
              {marked.has(q.id) ? '✓ Marked for review' : 'Mark for review'}
            </button>
          </div>
          <p className="text-slate-800 font-medium mb-4">{q.text}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAns(oi)}
                className={`w-full text-left text-sm rounded-lg px-3 py-2.5 border transition-colors ${
                  answers[q.id] === oi ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                ← Prev
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAns}>
                Clear
              </Button>
            </div>
            {idx < questions.length - 1 ? (
              <Button size="sm" onClick={() => setIdx((i) => i + 1)}>
                Save & Next →
              </Button>
            ) : (
              <Button size="sm" onClick={() => setConfirming(true)}>
                Submit test
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-4 lg:w-56">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Answered {answeredCount}/{questions.length}
          </p>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
            {questions.map((qq, i) => {
              const state = answers[qq.id] !== undefined ? 'done' : marked.has(qq.id) ? 'mark' : 'todo'
              return (
                <button
                  key={qq.id}
                  onClick={() => setIdx(i)}
                  className={`h-8 rounded text-xs font-medium ${
                    i === idx ? 'ring-2 ring-brand-500 ' : ''
                  }${
                    state === 'done'
                      ? 'bg-emerald-500 text-white'
                      : state === 'mark'
                      ? 'bg-amber-400 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-3 space-y-1 text-[11px] text-slate-500">
            <p><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500 mr-1.5 align-middle" />Answered</p>
            <p><span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1.5 align-middle" />Marked</p>
            <p><span className="inline-block w-3 h-3 rounded-sm bg-slate-200 mr-1.5 align-middle" />Not visited</p>
          </div>
          <Button className="w-full mt-3" size="sm" onClick={() => setConfirming(true)}>
            Submit test
          </Button>
          <button className="w-full text-xs text-slate-400 hover:text-slate-600 mt-2" onClick={() => navigate('/me/tests')}>
            Leave without submitting
          </button>
        </Card>
      </div>

      {confirming && (
        <Modal title="Submit test?" onClose={() => setConfirming(false)}>
          <p className="text-sm text-slate-600">
            You answered <span className="font-semibold">{answeredCount}</span> of {questions.length} questions
            {answeredCount < questions.length && <> · {questions.length - answeredCount} left blank</>}.
          </p>
          <p className="text-sm text-slate-500 mt-1">Once submitted you can't change your answers — you'll see the scorecard and full solutions.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep going
            </Button>
            <Button onClick={() => { setConfirming(false); submit(false) }}>Submit now</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
