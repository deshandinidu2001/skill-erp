import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/types";

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.timestamp}-${index}`} className="flex gap-3">
          <span className="mt-1 h-2 w-2 rounded-full bg-cyan-600" />
          <div>
            <p className="text-sm font-medium text-slate-950">
              {item.actor} {item.action}
            </p>
            <p className="text-sm text-slate-500">{item.summary}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
