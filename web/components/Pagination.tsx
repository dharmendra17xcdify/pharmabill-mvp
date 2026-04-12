'use client';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number; // 0 = All
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  if (total === 0) return null;

  const showingAll = pageSize === 0;
  const totalPages = showingAll ? 1 : Math.ceil(total / pageSize);
  const start = showingAll ? 1 : (page - 1) * pageSize + 1;
  const end = showingAll ? total : Math.min(page * pageSize, total);

  // Build page number list with ellipsis
  const pages: (number | '...')[] = [];
  if (!showingAll && totalPages > 1) {
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-xs">{start}–{end} of {total}</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={0}>All</option>
        </select>
      </div>

      {!showingAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`px-2.5 py-1 rounded border text-xs ${
                  p === page
                    ? 'bg-blue-600 text-white border-blue-600 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
