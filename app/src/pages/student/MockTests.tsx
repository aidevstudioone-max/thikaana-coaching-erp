import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Badge, Button, Card, EmptyState, Modal, PageHeader, StatCard } from '../../components/ui'
import Certificate from '../../components/Certificate'
import { pct } from '../../lib/format'
import { questionsFor, studentAttempt } from '../../lib/exam'
import { mockLeaderboard } from '../../lib/leaderboard'
import { batchName, examRanking, subjectName } from '../../lib/selectors'
import { useMyStudent } from '../../lib/portal'
import type { Exam, ExamAttempt } from '../../lib/types'

export default function MockTests() {
  const { student } = useMyStudent()
  const [cert, setCert] = useState<{ exam: Exam; attempt: ExamAttempt } | null>(null)
  if (!student) return <EmptyState title="No student linked to this login" />

  const online = getAll<Exam>(COLLECTIONS.exams)
    .filter((e) => e.mode === 'ONLINE' && e.batchId === student.batchId)
    .map((e) => ({
      exam: e,
      qCount: questionsFor(e.id).length,
      attempt: studentAttempt(e.id, student.id)
    }))
    .sort((a, b) => b.exam.date.localeCompare(a.exam.date))

  const available = online.filter((x) => !x.attempt)
  const done = online.filter((x) => x.attempt)
  const avg = done.length
    ? Math.round(done.reduce((s, x) => s + pct(Math.max(0, x.attempt!.score), x.exam.maxMarks), 0) / done.length)
    : 0
  const board = mockLeaderboard(student.batchId)
  const myRank = board.find((r) => r.student.id === student.id)

  return (
    <div>
      <PageHeader
        title="Mock Tests"
        subtitle="Attempt competitive-exam papers online. Auto-graded, with a full answer review."
        actions={
          <Link to="/me/leaderboard" className="bg-slate-100 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-200">
            🏆 Leaderboard
          </Link>
        }
      />

      {myRank && (
        <Link
          to="/me/leaderboard"
          className="flex items-center justify-between bg-brand-50 text-brand-800 rounded-lg px-4 py-2.5 text-sm mb-4 hover:bg-brand-100"
        >
          <span>
            🏆 You're <span className="font-semibold">#{myRank.rank}</span> of {board.length} in your batch
            <span className="text-brand-500"> · {myRank.avgPct}% average</span>
          </span>
          <span className="font-medium">Full standings →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Available now" value={String(available.length)} tone={available.length ? 'warn' : 'default'} />
        <StatCard label="Attempted" value={String(done.length)} />
        <StatCard label="Average score" value={`${avg}%`} tone={avg >= 50 ? 'good' : 'warn'} />
        <StatCard
          label="Best score"
          value={done.length ? `${Math.max(...done.map((x) => pct(Math.max(0, x.attempt!.score), x.exam.maxMarks)))}%` : '—'}
        />
      </div>

      <h3 className="font-semibold text-slate-800 mb-2">Available</h3>
      {available.length === 0 ? (
        <p className="text-sm text-slate-400 mb-6">No tests waiting — nice work. New papers show up here when your teacher publishes them.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {available.map(({ exam, qCount }) => (
            <Card key={exam.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">{exam.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{subjectName(exam.subjectId)}</p>
                </div>
                <Badge tone="indigo">Online</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-3">
                <span>📝 {qCount} questions</span>
                <span>⏱ {exam.durationMinutes} min</span>
                <span>➕ {exam.maxMarks / Math.max(1, qCount)} per correct</span>
                <span>➖ {exam.negativeMarks} per wrong</span>
              </div>
              <Link to={`/me/tests/${exam.id}`}>
                <Button className="w-full mt-4">Start test</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <h3 className="font-semibold text-slate-800 mb-2">Attempted</h3>
      {done.length === 0 ? (
        <EmptyState title="No attempts yet" subtitle="Your completed tests and scorecards will appear here." />
      ) : (
        <div className="space-y-2">
          {done.map(({ exam, attempt }) => {
            const p = pct(Math.max(0, attempt!.score), exam.maxMarks)
            return (
              <Card key={exam.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-slate-800">{exam.name}</p>
                  <p className="text-xs text-slate-400">
                    {subjectName(exam.subjectId)} · {attempt!.correctCount} correct · {attempt!.wrongCount} wrong · {attempt!.unattempted} skipped
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${p >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {attempt!.score} / {exam.maxMarks} ({p}%)
                  </span>
                  <button className="text-xs text-brand-600 font-medium" onClick={() => setCert({ exam, attempt: attempt! })}>
                    🏆 Certificate
                  </button>
                  <Link to={`/me/tests/${exam.id}`} className="text-xs text-brand-600 font-medium">
                    Review →
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {cert && (
        <Modal title="Your certificate" onClose={() => setCert(null)} wide>
          <Certificate
            exam={cert.exam}
            attempt={cert.attempt}
            studentName={student.name}
            batchLabel={batchName(cert.exam.batchId)}
            subjectLabel={subjectName(cert.exam.subjectId)}
            rank={examRanking(cert.exam.id).find((r) => r.studentId === student.id)?.rank}
            totalRanked={examRanking(cert.exam.id).length}
          />
        </Modal>
      )}
    </div>
  )
}
