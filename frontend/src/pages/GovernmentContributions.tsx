import { useEffect, useState } from 'react'
import { saveRate, useRates } from '../lib/contributionStore'
import { computeContribution, type Rate } from '../lib/contributions'
import { peso } from '../lib/payroll'

const NAMES: Record<Rate['type'], string> = { sss: 'SSS', philhealth: 'PhilHealth', pagibig: 'Pag-IBIG' }
const field = 'w-28 rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand)]'
const bd = { borderColor: 'var(--line)' }
const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

type Draft = { employeeRate: string; employerRate: string; minBase: string; maxBase: string; step: string }

const toDraft = (r: Rate): Draft => ({
  employeeRate: String(r.employeeRate),
  employerRate: String(r.employerRate),
  minBase: String(r.minBase),
  maxBase: r.maxBase == null ? '' : String(r.maxBase),
  step: r.step == null ? '' : String(r.step),
})

const toRate = (type: Rate['type'], d: Draft): Rate => ({
  type,
  employeeRate: Number(d.employeeRate) || 0,
  employerRate: Number(d.employerRate) || 0,
  minBase: Number(d.minBase) || 0,
  maxBase: d.maxBase === '' ? null : Number(d.maxBase),
  step: Number(d.step) > 0 ? Number(d.step) : null,
})

export default function GovernmentContributions() {
  const rates = useRates()
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [salary, setSalary] = useState('')

  useEffect(() => {
    setDrafts(Object.fromEntries(rates.map((r) => [r.type, toDraft(r)])))
  }, [rates])

  const edit = (type: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [type]: { ...d[type], ...patch } }))

  const save = async (type: Rate['type']) => {
    setSaving(type)
    setError('')
    try {
      await saveRate(toRate(type, drafts[type]))
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving('')
    }
  }

  const cols: [keyof Draft, string][] = [
    ['employeeRate', 'Employee %'],
    ['employerRate', 'Employer %'],
    ['minBase', 'Min base'],
    ['maxBase', 'Max base'],
    ['step', 'Rounding step'],
  ]

  return (
    <>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="card mb-6 overflow-x-auto">
        <div className="tbl-head">
          <h2 className="text-lg font-bold">Contribution Rates</h2>
        </div>
        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              <th>Type</th>
              {cols.map(([, label]) => <th key={label}>{label}</th>)}
              <th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => {
              const d = drafts[r.type]
              if (!d) return null
              return (
                <tr key={r.type}>
                  <td className="font-bold">{NAMES[r.type]}</td>
                  {cols.map(([key]) => (
                    <td key={key}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={field}
                        style={bd}
                        value={d[key]}
                        onChange={(e) => edit(r.type, { [key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td className="text-right">
                    <button disabled={saving === r.type} onClick={() => save(r.type)} className="btn-primary !px-4 !py-2 disabled:opacity-60">
                      {saving === r.type ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <div className="tbl-head">
          <h2 className="text-lg font-bold">Computation Preview</h2>
          <input
            type="number"
            min="0"
            placeholder="Monthly salary"
            className={field}
            style={bd}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {['Type', 'Base', 'Employee', 'Employer', 'Total'].map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => {
              const c = computeContribution(Number(salary) || 0, r)
              return (
                <tr key={r.type}>
                  <td className="font-bold">{NAMES[r.type]}</td>
                  <td>{peso(c.base)}</td>
                  <td>{peso(c.employee)}</td>
                  <td>{peso(c.employer)}</td>
                  <td className="font-bold">{peso(c.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}