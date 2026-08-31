import React from 'react'
import { COLLECTIONS, getAll } from '../../lib/db'
import { Card, PageHeader, StatCard, Table, currency } from '../../components/ui'
import type { Institute, SubscriptionPlan } from '../../lib/types'

export default function Subscriptions() {
  const plans = getAll<SubscriptionPlan>(COLLECTIONS.subscriptions)
  const institutes = getAll<Institute>(COLLECTIONS.institutes)
  const mrr = institutes.reduce((s, i) => s + i.mrr, 0)

  return (
    <div>
      <PageHeader title="Subscriptions & Plans" subtitle="Pricing tiers and how accounts are distributed across them." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="MRR" value={currency(mrr)} tone="good" />
        <StatCard label="ARR" value={currency(mrr * 12)} />
        <StatCard label="Paying Accounts" value={String(institutes.filter((i) => i.status === 'ACTIVE').length)} />
        <StatCard label="ARPA" value={currency(Math.round(mrr / Math.max(1, institutes.filter((i) => i.mrr > 0).length)))} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        {plans.map((p) => {
          const count = institutes.filter((i) => i.plan === p.name).length
          return (
            <Card key={p.id} className="p-5 flex flex-col">
              <h3 className="font-semibold text-slate-800">{p.name}</h3>
              <p className="text-2xl font-bold text-brand-700 mt-1">
                {currency(p.pricePerMonth)}
                <span className="text-sm font-normal text-slate-400">/month</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {p.studentLimit === -1 ? 'Unlimited students' : `Up to ${p.studentLimit} students`}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2">
                {count} institutes · {currency(count * p.pricePerMonth)} MRR
              </p>
            </Card>
          )
        })}
      </div>

      <Card>
        <Table columns={['Plan', 'Price', 'Student limit', 'Institutes', 'Contribution to MRR']}>
          {plans.map((p) => {
            const count = institutes.filter((i) => i.plan === p.name).length
            return (
              <tr key={p.id}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{p.name}</td>
                <td className="py-2.5 px-3">{currency(p.pricePerMonth)}</td>
                <td className="py-2.5 px-3">{p.studentLimit === -1 ? 'Unlimited' : p.studentLimit}</td>
                <td className="py-2.5 px-3">{count}</td>
                <td className="py-2.5 px-3">{currency(count * p.pricePerMonth)}</td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </div>
  )
}
