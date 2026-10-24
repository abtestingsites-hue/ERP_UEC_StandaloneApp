import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor: (item: T) => string;
  actionsTitle?: string;
  actions?: (row: T) => React.ReactNode;
  fullHeight?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  keyExtractor,
  actionsTitle,
  actions,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        Loading records...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium">
        No records found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3.5">
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3.5 text-right">{actionsTitle || 'Actions'}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => {
            const key = keyExtractor(item);
            return (
              <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-slate-700 font-medium">
                    {col.cell ? col.cell(item) : (item as any)[col.key] || '-'}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right">{actions(item)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
