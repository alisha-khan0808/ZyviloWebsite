"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Count } from "@/lib/admin/analytics";

export default function TimeChart({ data }: { data: Count[] }) {
  if (!data.some((d) => d.count > 0)) {
    return <p className="py-16 text-center text-sm text-muted">No leads in this period yet.</p>;
  }
  return (
    <div className="h-64" role="img" aria-label={`Leads over time: ${data.map((d) => `${d.key}: ${d.count}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="tc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7300FF" stopOpacity={0.35} />
              <stop offset="1" stopColor="#7300FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EEE8F7" vertical={false} />
          <XAxis dataKey="key" tick={{ fontSize: 11, fill: "#5E6075" }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5E6075" }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8DFF5", fontSize: 12 }} />
          <Area type="monotone" dataKey="count" name="Leads" stroke="#7300FF" strokeWidth={2} fill="url(#tc)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
