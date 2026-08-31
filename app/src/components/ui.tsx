import React from 'react'
import { initials } from '../lib/format'

export { currency, fmtDate, fmtDateTime, daysUntil, pct, initials, todayISO, monthKey } from '../lib/format'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const base =
    'inline-flex items-center gap-1.5 justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100'
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${sizes} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

type Tone = 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'indigo'
const toneCls: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-brand-100 text-brand-700'
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneCls[tone]}`}>{children}</span>
}

const statusTone: Record<string, Tone> = {
  ACTIVE: 'green',
  PAID: 'green',
  PRESENT: 'green',
  COMPLETED: 'green',
  RESOLVED: 'green',
  SENT: 'green',
  PENDING: 'amber',
  PARTIAL: 'amber',
  LATE: 'amber',
  TRIAL: 'amber',
  IN_PROGRESS: 'amber',
  HALF_DAY: 'amber',
  QUEUED: 'amber',
  SCHEDULED: 'blue',
  OVERDUE: 'red',
  ABSENT: 'red',
  SUSPENDED: 'red',
  FAILED: 'red',
  DROPPED: 'red',
  INACTIVE: 'slate',
  ARCHIVED: 'slate',
  OPEN: 'blue'
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'slate'}>{status.replace(/_/g, ' ')}</Badge>
}

export function StatCard({
  label,
  value,
  tone = 'default',
  hint
}: {
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger' | 'good'
  hint?: string
}) {
  const tones: Record<string, string> = {
    default: 'text-slate-900',
    warn: 'text-amber-600',
    danger: 'text-red-600',
    good: 'text-emerald-600'
  }
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Card>
  )
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-14 text-slate-400">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {subtitle && <p className="text-xs mt-1">{subtitle}</p>}
    </div>
  )
}

export function Table({ columns, children }: { columns: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {columns.map((c) => (
              <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-4 max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white'

export function Select({
  value,
  onChange,
  children,
  className = ''
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <select className={`${inputCls} ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  )
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const bar: Record<string, string> = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${bar[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export function ModuleDisabledNotice({ moduleName }: { moduleName: string }) {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h2 className="text-lg font-semibold text-slate-800">{moduleName} is switched off</h2>
      <p className="text-sm text-slate-500 mt-1">The Institute Owner can turn this module on from System → Modules.</p>
    </div>
  )
}

export function AccessDeniedNotice() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="text-4xl mb-3">🚫</div>
      <h2 className="text-lg font-semibold text-slate-800">Access denied</h2>
      <p className="text-sm text-slate-500 mt-1">Your role does not have permission to view this page.</p>
    </div>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] bg-slate-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
      <span>{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        &times;
      </button>
    </div>
  )
}
