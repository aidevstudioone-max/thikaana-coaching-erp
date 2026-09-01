import React, { useRef } from 'react'
import { COLLECTIONS, load } from '../lib/db'
import { fmtDate, pct } from '../lib/format'
import { Button } from './ui'
import type { Exam, ExamAttempt, Organization } from '../lib/types'

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function band(p: number) {
  if (p >= 75) return { title: 'Achievement', grade: 'Distinction', tone: '#15803d' }
  if (p >= 50) return { title: 'Achievement', grade: 'Merit', tone: '#4f46e5' }
  if (p >= 33) return { title: 'Achievement', grade: 'Pass', tone: '#b45309' }
  return { title: 'Participation', grade: 'Participation', tone: '#64748b' }
}

function downloadPng(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', '1000')
  clone.setAttribute('height', '700')
  const xml = new XMLSerializer().serializeToString(clone)
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
  const img = new Image()
  img.onload = () => {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = 1000 * scale
    canvas.height = 700 * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    }, 'image/png')
  }
  img.src = url
}

export default function Certificate({
  exam,
  attempt,
  studentName,
  batchLabel,
  subjectLabel,
  rank,
  totalRanked
}: {
  exam: Exam
  attempt: ExamAttempt
  studentName: string
  batchLabel: string
  subjectLabel: string
  rank?: number
  totalRanked?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const org = load<Organization>(COLLECTIONS.organization, {} as Organization)
  const percentage = pct(Math.max(0, attempt.score), exam.maxMarks)
  const b = band(percentage)
  const certId = `TCE-${attempt.id.slice(-6).toUpperCase()}`
  const fileName = `Thikaana-Certificate-${studentName.replace(/\s+/g, '-')}.png`
  const attempted = attempt.correctCount + attempt.wrongCount

  return (
    <div>
      <div id="print-area">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto border border-slate-200 rounded-lg"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          <rect width="1000" height="700" fill="#fffdf6" />
          <rect x="16" y="16" width="968" height="668" fill="none" stroke="#4f46e5" strokeWidth="3" />
          <rect x="28" y="28" width="944" height="644" fill="none" stroke="#c7d2fe" strokeWidth="1.5" />

          <text
            x="500"
            y="470"
            textAnchor="middle"
            fontSize="150"
            fontWeight="700"
            fill="#4f46e5"
            opacity="0.05"
            letterSpacing="14"
          >
            THIKAANA
          </text>

          <text x="500" y="92" textAnchor="middle" fontSize="19" letterSpacing="4" fill="#4f46e5" fontWeight="700">
            {short((org.name || 'Coaching Institute').toUpperCase(), 46)}
          </text>
          <text x="500" y="115" textAnchor="middle" fontSize="12" letterSpacing="2" fill="#94a3b8">
            {short(org.tagline || '', 70)}
          </text>

          <text x="500" y="178" textAnchor="middle" fontSize="42" fill="#1e1b4b">
            Certificate of {b.title}
          </text>
          <line x1="410" y1="196" x2="590" y2="196" stroke="#4f46e5" strokeWidth="2" />

          <text x="500" y="248" textAnchor="middle" fontSize="16" fill="#475569">
            This is to certify that
          </text>
          <text x="500" y="312" textAnchor="middle" fontSize="46" fontStyle="italic" fill="#111827">
            {short(studentName, 34)}
          </text>
          <line x1="330" y1="330" x2="670" y2="330" stroke="#e2e8f0" strokeWidth="1.5" />

          <text x="500" y="372" textAnchor="middle" fontSize="16" fill="#475569">
            has completed the online mock test
          </text>
          <text x="500" y="404" textAnchor="middle" fontSize="21" fontWeight="700" fill="#1e1b4b">
            {short(exam.name, 52)}
          </text>
          <text x="500" y="428" textAnchor="middle" fontSize="13" fill="#64748b">
            {short(`${subjectLabel} · ${batchLabel}`, 64)}
          </text>

          {/* stat blocks */}
          {[
            { x: 285, label: 'SCORE', value: `${attempt.score} / ${exam.maxMarks}` },
            { x: 500, label: 'PERCENTAGE', value: `${percentage}%` },
            { x: 715, label: rank ? 'BATCH RANK' : 'ACCURACY', value: rank ? `#${rank}${totalRanked ? ` / ${totalRanked}` : ''}` : `${pct(attempt.correctCount, attempted || 1)}%` }
          ].map((s) => (
            <g key={s.label}>
              <text x={s.x} y="486" textAnchor="middle" fontSize="11" letterSpacing="2" fill="#94a3b8" fontFamily="Inter, system-ui, sans-serif">
                {s.label}
              </text>
              <text x={s.x} y="516" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1e1b4b">
                {s.value}
              </text>
            </g>
          ))}

          <text x="500" y="566" textAnchor="middle" fontSize="15" fill={b.tone} fontWeight="700">
            Awarded with {b.grade}
          </text>

          <text x="150" y="632" fontSize="13" fill="#475569">
            Date: {fmtDate(attempt.submittedAt)}
          </text>
          <text x="150" y="652" fontSize="11" fill="#94a3b8">
            Certificate ID: {certId}
          </text>

          <line x1="720" y1="628" x2="880" y2="628" stroke="#94a3b8" strokeWidth="1" />
          <text x="800" y="648" textAnchor="middle" fontSize="12" fill="#64748b">
            Authorised Signatory
          </text>

          <circle cx="500" cy="628" r="26" fill="none" stroke="#4f46e5" strokeWidth="2" />
          <text x="500" y="633" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4f46e5">
            {percentage}%
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 no-print">
        <Button size="sm" onClick={() => svgRef.current && downloadPng(svgRef.current, fileName)}>
          ⬇ Download certificate
        </Button>
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>
      <p className="text-xs text-slate-400 mt-2 no-print">Downloads a PNG you can print or attach. Demo certificate — not an official credential.</p>
    </div>
  )
}
