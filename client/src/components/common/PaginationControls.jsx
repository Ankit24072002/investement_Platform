export default function PaginationControls({ page, totalPages, total, pageSize = 20, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
      <span>Showing {firstItem}–{lastItem} of {total}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className="premium-button secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <span className="flex items-center px-2">Page {page} of {totalPages}</span>
        <button
          type="button"
          className="premium-button secondary"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
