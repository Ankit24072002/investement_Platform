import { Link } from 'react-router-dom';

export default function DashboardHistoryTable({
  columns,
  rows,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  viewAllTo,
}) {
  return (
    <div>
      {error ? (
        <div role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : loading ? (
        <div className="space-y-2.5" aria-label="Loading table">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-12 animate-pulse rounded-lg border border-white/[0.035] bg-white/[0.025]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.09] bg-white/[0.015] px-5 py-7 text-center">
          <p className="text-sm font-medium text-slate-300">{emptyTitle}</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="min-w-full text-left text-[12px]">
            <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[0.15em] text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-3.5 py-3 font-semibold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row._id || row.id || index} className="border-t border-white/[0.045] text-slate-300 hover:bg-white/[0.025]">
                  {columns.map((column) => (
                    <td key={column.key} className="max-w-56 px-3.5 py-3 align-middle">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!error && !loading && rows.length > 0 && viewAllTo && (
        <div className="mt-3 flex justify-end">
          <Link to={viewAllTo} className="text-xs font-medium text-blue-300 transition hover:text-blue-200">
            View full history <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
