import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useEmployees } from '../lib/employeeStore'
import type { PayslipRow } from '../lib/payrollRunStore'

type Props = { slip: PayslipRow; periodStart: string; periodEnd: string; onClose: () => void }

const fmtDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const money = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dash = (n: number) => (n ? money(n) : '-')

const ONES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
  'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const below1000 = (n: number): string => {
  const parts: string[] = []
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100 }
  if (n >= 20) parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''))
  else if (n > 0) parts.push(ONES[n])
  return parts.join(' ')
}
const toWords = (n: number) => {
  if (n === 0) return 'Zero'
  const scales: [number, string][] = [[1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1000, 'Thousand']]
  const parts: string[] = []
  for (const [v, name] of scales) {
    if (n >= v) { parts.push(`${below1000(Math.floor(n / v))} ${name}`); n %= v }
  }
  if (n > 0) parts.push(below1000(n))
  return parts.join(' ')
}
const pesosInWords = (amount: number) => {
  const cents = Math.round(amount * 100)
  return `${toWords(Math.floor(cents / 100))} and ${String(cents % 100).padStart(2, '0')}/100 Pesos`
}

const Row = ({ label, value, indent = false, bold = false }: {
  label: string; value: string; indent?: boolean; bold?: boolean
}) => (
  <div className={`flex justify-between py-[1px] ${indent ? 'pl-6' : ''} ${bold ? 'font-bold' : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
)
const Rule = () => <div className="my-1 border-t border-slate-900" />

export default function PayslipModal({ slip, periodStart, periodEnd, onClose }: Props) {
  const employees = useEmployees()
  const empNo = slip.employeeNo ?? employees.find((e) => e.id === slip.employeeId)?.employeeNo ?? '—'
  const period = `${fmtDate(periodStart)} to ${fmtDate(periodEnd)}`

 const n = (v?: number | string | null) => Number(v ?? 0)
  const totalSalary = n(slip.gross) + n(slip.slCashConversion) + n(slip.overtimePay) - n(slip.deduction)
  const netSalary =
    totalSalary - n(slip.sss) - n(slip.philhealth) - n(slip.pagIbig) -
    n(slip.cashAdvance) - n(slip.sssLoan) - n(slip.hdmfLoan)
  const remittance = netSalary + n(slip.transportAllowance) + n(slip.riceAllowance)

  return createPortal(
    <div className="payslip-portal fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <style>{`
        @page { margin: 12mm; }
        @media print {
          body > *:not(.payslip-portal) { display: none !important; }
          .payslip-portal { position: static !important; background: none !important; padding: 0 !important; display: block !important; }
          .payslip-card, .payslip-scroll { max-height: none !important; overflow: visible !important; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="payslip-card flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--card)] shadow-xl">
        <div className="no-print flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-lg font-bold">Pay Slip</h2>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button className="btn-icon" aria-label="Close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="payslip-scroll overflow-y-auto p-6">
          <div id="payslip-sheet" className="mx-auto w-full max-w-[520px] border border-slate-900 bg-white p-4 font-serif text-[12px] text-slate-900">
            <h3 className="text-center text-base font-bold">Pay Slip</h3>
            <p>Archon Nell Incorporated</p>
            <p>For the Period {period}</p>
            <div className="mt-2 flex justify-between">
              <span>Name: {slip.employeeName}</span>
              <span>Employee No.: {empNo}</span>
            </div>
            <Rule />

            <Row label="Basic Salary" value={dash(n(slip.gross))} />
            <Row label="Add(Deduct):" value="" />
            <Row indent label="SL - Cash Conversion" value={dash(n(slip.slCashConversion))} />
            <Row indent label="Overtime (Reg OT/Sun OT/Hol-ND OT)" value={dash(n(slip.overtimePay))} />
            <Row indent label="(Absent/Undertime/Lates)" value={slip.deduction ? `(${money(slip.deduction)})` : '-'} />
            <Rule />
            <Row bold label="Total Salary" value={money(totalSalary)} />

            <Row label="Less:" value="" />
            <Row indent label="SSS" value={dash(n(slip.sss))} />
            <Row indent label="Philhealth" value={dash(n(slip.philhealth))} />
            <Row indent label="HDMF" value={dash(n(slip.pagIbig))} />
            <Rule />

            <Row label="Less:" value="" />
            <Row indent label="Cash Advance" value={dash(n(slip.cashAdvance))} />
            <Row indent label="SSS Loan" value={dash(n(slip.sssLoan))} />
            <Row indent label="HDMF Loan" value={dash(n(slip.hdmfLoan))} />
            <Rule />
            <Row bold label="Net Salary" value={money(netSalary)} />

            <Row label="Add:" value="" />
            <Row indent label="Transportation Allowance" value={dash(n(slip.transportAllowance))} />
            <Row indent label="Rice Subsidy Allowance" value={dash(n(slip.riceAllowance))} />
            <Rule />
            <Row bold label="Total Remittance" value={`Php${money(remittance)}`} />
            <p className="text-[10px] italic text-slate-600">{pesosInWords(remittance)}</p>

            <div className="mt-4 border-t border-slate-900 pt-3">
              <div className="flex justify-between">
                <span>Name: {slip.employeeName}</span>
                <span>Employee No.: {empNo}</span>
              </div>
              <p>For the Period {period}</p>
              <div className="mt-10 ml-auto w-44 border-t border-slate-900 pt-1 text-center text-[10px]">Received By</div>
            </div>
          </div>

          <p className="no-print mt-4 text-center text-xs text-[var(--muted)]">
            This is a system-generated payslip for {periodStart} to {periodEnd}.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}