import clsx from "clsx";
import { STATUS_LABELS } from "@/lib/admin/labels";

const TONE: Record<string, string> = {
  new: "bg-purple/10 text-purple",
  contacted: "bg-sky-50 text-sky-700",
  qualified: "bg-indigo-50 text-indigo-700",
  discovery_scheduled: "bg-violet-50 text-violet-700",
  proposal_sent: "bg-amber-50 text-amber-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-slate-100 text-slate-600",
  nurture: "bg-teal-50 text-teal-700",
  spam: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status])}>{STATUS_LABELS[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        priority === "high" ? "bg-red-50 text-red-700" : priority === "low" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700",
      )}
    >
      {priority}
    </span>
  );
}
