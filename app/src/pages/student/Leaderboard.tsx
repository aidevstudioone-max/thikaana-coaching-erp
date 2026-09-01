import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Card, EmptyState, PageHeader, Select, StatCard, Table } from '../../components/ui'
import { pct } from '../../lib/format'
import { mockLeaderboard, medal, onlineExamsForBatch } from '../../lib/leaderboard'
import { examRanking } from '../../lib/selectors'
import { attemptsFor } from '../../lib/exam'
import { useMyStudent } from '../../lib/portal'
import type { Exam } from '../../lib/types'

export default function Leaderboard() {
  const { student, batch } = useMyStudent()
  const [view, setView] = useState('overall')

  const exams = useMemo(() => (student ? onlineExamsForBatch(student.batchId) : []), [student])
  const overall = useMemo(() => (student ? mockLeaderboard(student.batchId) : []), [student])

  if (!student) return <EmptyState title="No student linked to this login" />

  const mine = overall.find((r) => r.student.id === student.id)
  const attemptedAny = exams.some((e) => attemptsFor(e.id).some((a) => a.studentId === student.id))

  return (
    <div>
      <PageHeader
        title="Mock Test Leaderboard"
        subtitle={`${batch?.name} · ranked across ${exams.length} online mock test${exams.length === 1 ? '' : 's'}`}
        actions={
          <Link to="/me/tests" className="bg-slate-100 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-200">
            Mock Tests
          </Link>
        }
      />

      <Select value={view} onChange={setView} className="max-w-xs mb-4">
        <option value="overall">Overall standings</option>
        {exams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </Select>

      {view === 'overall' ? (
        overall.length === 0 ? (
          <EmptyState title="No standings yet" subtitle="The leaderboard fills up as students in your batch attempt online mock tests." />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <StatCard label="Your rank" value={mine ? `#${mine.rank}` : '—'} tone={mine && mine.rank <= 3 ? 'good' : 'default'} hint={`of ${overall.length}`} />
              <StatCard label="Your average" value={mine ? `${mine.avgPct}%` : '—'} />
              <StatCard label="Your best" value={mine ? `${mine.bestPct}%` : '—'} />
              <StatCard label="Tests taken" value={mine ? `${mine.testsTaken} / ${exams.length}` : `0 / ${exams.length}`} />
            </div>

            {!attemptedAny && (
              <p className="text-sm text-amber-600 mb-3">
                You haven't attempted a mock test yet —{' '}
                <Link to="/me/tests" className="font-medium underline">
                  take one
                </Link>{' '}
                to get on the board.
              </p>
            )}

            <Card>
              <Table columns={['Rank', 'Student', 'Tests', 'Avg %', 'Best %', 'Total']}>
                {overall.map((r) => {
                  const you = r.student.id === student.id
                  return (
                    <tr key={r.student.id} className={you ? 'bg-brand-50' : ''}>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700">{medal(r.rank) || `#${r.rank}`}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.student.name} size={28} />
                          <span className={`font-medium ${you ? 'text-brand-700' : 'text-slate-800'}`}>
                            {r.student.name} {you && <span className="text-xs text-brand-500">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{r.testsTaken}</td>
                      <td className="py-2.5 px-3 font-medium">{r.avgPct}%</td>
                      <td className="py-2.5 px-3">{r.bestPct}%</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {r.totalScore} / {r.totalMax}
                      </td>
                    </tr>
                  )
                })}
              </Table>
            </Card>
          </>
        )
      ) : (
        <PerTest exam={exams.find((e) => e.id === view)} studentId={student.id} />
      )}
    </div>
  )
}

function PerTest({ exam, studentId }: { exam?: Exam; studentId: string }) {
  if (!exam) return <EmptyState title="Test not found" />
  const rows = examRanking(exam.id)
  const byStudent = Object.fromEntries(attemptsFor(exam.id).map((a) => [a.studentId, a]))

  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">
        {exam.name} · out of {exam.maxMarks} · {rows.length} attempt{rows.length === 1 ? '' : 's'}
      </p>
      <Card>
        <Table columns={['Rank', 'Student', 'Score', '%', 'Correct', 'Wrong', 'Accuracy']}>
          {rows.map((r, i) => {
            const a = byStudent[r.studentId]
            const acc = a ? pct(a.correctCount, a.correctCount + a.wrongCount) : 0
            const you = r.studentId === studentId
            return (
              <tr key={r.id} className={you ? 'bg-brand-50' : ''}>
                <td className="py-2.5 px-3 font-semibold text-slate-700">{medal(i + 1) || `#${i + 1}`}</td>
                <td className="py-2.5 px-3">
                  <span className={`font-medium ${you ? 'text-brand-700' : 'text-slate-800'}`}>
                    {r.student?.name ?? '—'} {you && <span className="text-xs text-brand-500">(You)</span>}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {r.marks} / {exam.maxMarks}
                </td>
                <td className="py-2.5 px-3 font-medium">{pct(Math.max(0, r.marks), exam.maxMarks)}%</td>
                <td className="py-2.5 px-3 text-emerald-600">{a?.correctCount ?? '—'}</td>
                <td className="py-2.5 px-3 text-red-600">{a?.wrongCount ?? '—'}</td>
                <td className="py-2.5 px-3">{a ? `${acc}%` : '—'}</td>
              </tr>
            )
          })}
        </Table>
        {rows.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No attempts on this test yet.</p>}
      </Card>
    </div>
  )
}
