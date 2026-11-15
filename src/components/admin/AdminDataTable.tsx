import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type AdminColumn<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

type AdminDataTableProps<T> = {
  title: string
  description?: string
  columns: AdminColumn<T>[]
  rows: T[]
  emptyMessage: string
  getRowKey: (row: T) => string
  actions?: ReactNode
}

export function AdminDataTable<T>({
  title,
  description,
  columns,
  rows,
  emptyMessage,
  getRowKey,
  actions,
}: AdminDataTableProps<T>) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-ink/75">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink/65">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-ink/60"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={getRowKey(row)} className="border-t border-gold/15">
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3', col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}