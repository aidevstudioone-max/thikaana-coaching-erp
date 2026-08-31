import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MODULE_DEFS } from '../../lib/modules'
import { Badge, Card, PageHeader, Tabs } from '../../components/ui'

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const

export default function Roles() {
  const { roles } = useAuth()
  const [active, setActive] = useState(roles[0]?.name ?? '')
  const role = roles.find((r) => r.name === active)

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="What each role can do, per module. System roles are read-only in this demo." />
      <Tabs tabs={roles.map((r) => r.name)} active={active} onChange={setActive} />

      {role && (
        <>
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="indigo">{role.portal} portal</Badge>
              {role.isSuperAdmin && <Badge tone="red">Super Admin</Badge>}
              {role.isSystem && <Badge tone="slate">System role</Badge>}
            </div>
            <p className="text-sm text-slate-500 mt-2">{role.description}</p>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="py-2.5 px-3 text-center">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULE_DEFS.map((m) => {
                    const p = role.permissions[m.id]
                    return (
                      <tr key={m.id}>
                        <td className="py-2 px-3 text-slate-700">{m.name}</td>
                        {ACTIONS.map((a) => (
                          <td key={a} className="py-2 px-3 text-center">
                            {role.isSuperAdmin || p?.[a] ? (
                              <span className="text-emerald-600">✓</span>
                            ) : (
                              <span className="text-slate-300">–</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
