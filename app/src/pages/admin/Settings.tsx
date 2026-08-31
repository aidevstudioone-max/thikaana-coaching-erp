import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COLLECTIONS, load, save } from '../../lib/db'
import { logAudit } from '../../lib/audit'
import { Button, Card, Field, PageHeader, Toast, inputCls } from '../../components/ui'
import type { Organization, Settings as SettingsT } from '../../lib/types'

export default function Settings() {
  const { user } = useAuth()
  const [org, setOrg] = useState<Organization>(() => load<Organization>(COLLECTIONS.organization, {} as Organization))
  const [settings, setSettings] = useState<SettingsT>(() => load<SettingsT>(COLLECTIONS.settings, {} as SettingsT))
  const [toast, setToast] = useState('')

  const persist = () => {
    save(COLLECTIONS.organization, org)
    save(COLLECTIONS.settings, settings)
    logAudit(user, 'Settings', 'SETTINGS_UPDATED', org.name)
    setToast('Settings saved.')
  }

  const reset = () => {
    if (!confirm('Reset all demo data? This clears every change you made and reloads the seed dataset.')) return
    Object.keys(localStorage)
      .filter((k) => k.startsWith('tcerp:'))
      .forEach((k) => localStorage.removeItem(k))
    location.reload()
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Institute profile, receipt and fee defaults." />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Institute profile</h3>
          <Field label="Name">
            <input className={inputCls} value={org.name ?? ''} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <input className={inputCls} value={org.tagline ?? ''} onChange={(e) => setOrg({ ...org, tagline: e.target.value })} />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={org.address ?? ''} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input className={inputCls} value={org.phone ?? ''} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={org.email ?? ''} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="GSTIN">
              <input className={inputCls} value={org.gstin ?? ''} onChange={(e) => setOrg({ ...org, gstin: e.target.value })} />
            </Field>
            <Field label="UPI ID">
              <input className={inputCls} value={org.upiId ?? ''} onChange={(e) => setOrg({ ...org, upiId: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Fees & receipts</h3>
          <Field label="Academic year">
            <input className={inputCls} value={settings.academicYear ?? ''} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} />
          </Field>
          <Field label="Receipt prefix">
            <input className={inputCls} value={settings.receiptPrefix ?? ''} onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Late fee / day (₹)">
              <input
                type="number"
                className={inputCls}
                value={settings.lateFeePerDay ?? 0}
                onChange={(e) => setSettings({ ...settings, lateFeePerDay: +e.target.value })}
              />
            </Field>
            <Field label="WhatsApp sender name">
              <input
                className={inputCls}
                value={settings.whatsappSenderName ?? ''}
                onChange={(e) => setSettings({ ...settings, whatsappSenderName: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Demo data</p>
            <p className="text-xs text-slate-500 mt-1 mb-2">Everything is stored in this browser only. Reset to get the original seed dataset back.</p>
            <Button variant="danger" size="sm" onClick={reset}>
              Reset demo data
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Button onClick={persist}>Save settings</Button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
