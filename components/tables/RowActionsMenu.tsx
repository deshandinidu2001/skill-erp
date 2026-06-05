"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

export type RowAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-10 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 data-[destructive=true]:text-red-600"
              data-destructive={action.destructive}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
