import { useState, type FormEvent } from 'react'
import { addEmployee, removeEmployee, updateEmployee, useEmployees } from '../lib/employeeStore'

const input =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0b1220]'

export default function EmployeeData() {
  const employees = useEmployees()
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = Number(rate)
    if (!name.trim() || !(r > 0)) return
    addEmployee(name.trim(), r)
    setName('')
    setRate('')
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#131c2e]"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Employee name</label>
          <input className={`${input} w-64`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Daily rate (₱)</label>
          <input
            className={`${input} w-40`}
            type="number"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <button className="rounded-lg bg-[#2f5fe0] px-4 py-2 text-sm font-semibold text-white">Add Employee</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#131c2e]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Employee', 'Daily Rate (₱)', ''].map((c) => (
                <th key={c} className="border-b border-slate-200 px-5 py-3.5 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr><td colSpan={3} className="p-10 text-center text-slate-500">Wala pang employee. Mag-add ng una sa taas.</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                <td className="px-5 py-3.5"><strong>{emp.name}</strong></td>
                <td className="px-5 py-3.5">
                  <input
                    key={emp.dailyRate}
                    className={`${input} w-32`}
                    type="number"
                    min="0"
                    defaultValue={emp.dailyRate}
                    onBlur={(e) => {
                      const r = Number(e.target.value)
                      if (r > 0 && r !== emp.dailyRate) updateEmployee(emp.id, { dailyRate: r })
                    }}
                  />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    className="text-sm text-red-600"
                    onClick={() => confirm(`Burahin si ${emp.name}?`) && removeEmployee(emp.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Ang bagong daily rate ay para sa susunod na time in lang. Hindi nagbabago ang mga nakaraang araw.
      </p>
    </>
  )
}