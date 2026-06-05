"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { TableFilters } from "@/components/tables/TableFilters";
import { TablePagination } from "@/components/tables/TablePagination";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  enableExport?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
  enableExport,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const memoizedData = useMemo(() => data, [data]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilter(globalFilter), 300);
    return () => window.clearTimeout(timer);
  }, [globalFilter]);

  const table = useReactTable({
    data: memoizedData,
    columns,
    state: { globalFilter: debouncedFilter },
    onGlobalFilterChange: setDebouncedFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <TableFilters value={globalFilter} onChange={setGlobalFilter} />
        {enableExport ? (
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {columns.map((_, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <LoadingSkeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => <MemoTableRow key={row.id} row={row} />)}
          </tbody>
        </table>
      </div>
      {!loading && table.getRowModel().rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No data" description={emptyMessage} />
        </div>
      ) : null}
      <TablePagination table={table} />
    </div>
  );
}

const MemoTableRow = memo(function MemoTableRow<TData>({
  row,
}: {
  row: ReturnType<ReturnType<typeof useReactTable<TData>>["getRowModel"]>["rows"][number];
}) {
  return (
    <tr className="hover:bg-slate-50">
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-4 py-3 text-slate-700">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
});
