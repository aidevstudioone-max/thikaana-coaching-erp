import React from 'react'
import { COLLECTIONS, getAll, load } from '../lib/db'
import { currency, fmtDate } from '../lib/format'
import { staffName } from '../lib/selectors'
import type { FeeInvoice, Organization, Payment, Student } from '../lib/types'

export default function Receipt({ payment }: { payment: Payment }) {
  const org = load<Organization>(COLLECTIONS.organization, {} as Organization)
  const student = getAll<Student>(COLLECTIONS.students).find((s) => s.id === payment.studentId)
  const invoice = getAll<FeeInvoice>(COLLECTIONS.feeInvoices).find((i) => i.id === payment.invoiceId)

  return (
    <div id="print-area" className="bg-white border border-slate-200 rounded-lg p-6 text-sm text-slate-800 max-w-lg mx-auto">
      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{org.name}</p>
          <p className="text-xs text-slate-500">{org.address}</p>
          <p className="text-xs text-slate-500">
            {org.phone} · {org.email}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-brand-700">FEE RECEIPT</p>
          <p className="text-xs text-slate-500">{payment.receiptNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1 gap-x-4 py-3 text-xs">
        <p>
          <span className="text-slate-400">Student:</span> {student?.name}
        </p>
        <p>
          <span className="text-slate-400">Admission No:</span> {student?.admissionNo}
        </p>
        <p>
          <span className="text-slate-400">Date:</span> {fmtDate(payment.paidAt)}
        </p>
        <p>
          <span className="text-slate-400">Mode:</span> {payment.mode}
          {payment.reference ? ` · ${payment.reference}` : ''}
        </p>
      </div>

      <table className="w-full text-xs border-t border-b border-slate-200 my-2">
        <tbody>
          <tr>
            <td className="py-2">{invoice?.title ?? 'Fee payment'}</td>
            <td className="py-2 text-right font-medium">{currency(payment.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between font-semibold text-slate-900 mt-1">
        <span>Amount received</span>
        <span>{currency(payment.amount)}</span>
      </div>
      {invoice && (
        <p className="text-xs text-slate-500 mt-1">
          Installment balance: {currency(invoice.amount - invoice.paidAmount)} · Status: {invoice.status}
        </p>
      )}

      <div className="flex justify-between items-end mt-6 text-xs text-slate-500">
        <div>
          <p>Collected by: {staffName(payment.collectedByStaffId)}</p>
          <p className="mt-1">This is a computer-generated receipt.</p>
        </div>
        <div className="text-center">
          <p className="border-t border-slate-300 pt-1 mt-6">Authorised Signatory</p>
        </div>
      </div>
    </div>
  )
}
