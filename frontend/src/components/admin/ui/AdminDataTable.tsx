import { useState, useMemo, useRef, useEffect, useCallback, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Search,
  Filter,
} from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: { label: string; value: string }[];
  selectedFilter?: string;
  onFilterChange?: (val: string) => void;
  bulkActions?: {
    label: string;
    action: (selectedRows: T[]) => void;
    variant?: 'danger' | 'primary' | 'secondary';
  }[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
  };
  /** When true, replaces prev/next buttons with an IntersectionObserver sentinel */
  infiniteScroll?: boolean;
  /** Called when the sentinel enters the viewport (only used with infiniteScroll) */
  onLoadMore?: () => void;
  /** Whether more data exists to load (only used with infiniteScroll) */
  hasMore?: boolean;
  /** Whether additional data is currently loading (only used with infiniteScroll) */
  loadingMore?: boolean;
  keyExtractor: (item: T) => string;
  filename?: string;
}

export default function AdminDataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  onSearchChange,
  filterOptions,
  selectedFilter,
  onFilterChange,
  bulkActions,
  pagination,
  infiniteScroll = false,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  keyExtractor,
  filename = 'export-data',
}: AdminDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore],
  );

  useEffect(() => {
    if (!infiniteScroll) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleIntersect, { rootMargin: '150px' });
    const el = sentinelRef.current;
    if (el) observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [infiniteScroll, handleIntersect]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleSort = (key?: keyof T, sortable?: boolean) => {
    if (!key || !sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(data.map(keyExtractor));
      setSelectedIds(allIds);
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const keys = columns.filter((c) => c.accessorKey).map((c) => c.accessorKey as string);
    const headers = columns.filter((c) => c.accessorKey).map((c) => c.header);

    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        keys
          .map((k) => {
            const val = row[k];
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedRowsList = useMemo(() => {
    return data.filter((row) => selectedIds.has(keyExtractor(row)));
  }, [data, selectedIds, keyExtractor]);

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-lg)]">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[var(--border-secondary)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
            />
          </div>

          {filterOptions && onFilterChange && (
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
              <select
                value={selectedFilter || ''}
                onChange={(e) => onFilterChange(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {bulkActions && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-secondary)]">
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                {selectedIds.size} selected
              </span>
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.action(selectedRowsList)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                    action.variant === 'danger'
                      ? 'bg-[var(--color-error-500)]/15 text-[var(--color-error-500)] hover:bg-[var(--color-error-500)]/25 border border-[var(--color-error-500)]/25'
                      : 'bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-500)]/25 border border-[var(--color-primary-500)]/25'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={exportCSV}
            title="Export CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-secondary)] rounded-[var(--radius-md)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-secondary)] text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {bulkActions && (
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--border-primary)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] bg-[var(--bg-secondary)] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(col.accessorKey, col.sortable)}
                  className={`p-4 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <ArrowUpDown className="w-3 h-3 text-[var(--text-tertiary)]" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-secondary)] text-sm text-[var(--text-primary)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {bulkActions && (
                    <td className="p-4">
                      <div className="w-4 h-4 bg-[var(--bg-tertiary)] rounded" />
                    </td>
                  )}
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="p-4">
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="p-8 text-center text-[var(--text-tertiary)]"
                >
                  No records found matching your criteria.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const key = keyExtractor(row);
                const isSelected = selectedIds.has(key);
                return (
                  <tr
                    key={key}
                    className={`hover:bg-[var(--bg-tertiary)]/50 transition-colors ${
                      isSelected ? 'bg-[var(--color-primary-500)]/5' : ''
                    }`}
                  >
                    {bulkActions && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(key)}
                          className="rounded border-[var(--border-primary)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)] bg-[var(--bg-secondary)] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td key={i} className="p-4 align-middle">
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && !infiniteScroll && (
        <div className="p-4 border-t border-[var(--border-secondary)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <div>
            Showing page <span className="font-semibold text-[var(--text-primary)]">{pagination.currentPage}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.totalPages}</span>
            {pagination.totalItems && (
              <span className="ml-2">({pagination.totalItems} total items)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel + loading indicator */}
      {infiniteScroll && (
        <>
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="p-4 border-t border-[var(--border-secondary)] flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
              <div className="w-3.5 h-3.5 border-2 border-[var(--border-primary)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
              Loading more rows...
            </div>
          )}
          {!hasMore && !loadingMore && data.length > 0 && (
            <p className="p-3 text-center text-xs text-[var(--text-tertiary)] font-medium border-t border-[var(--border-secondary)]">
              ✓ All records loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
