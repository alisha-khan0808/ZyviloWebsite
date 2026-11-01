"use client";

import dynamic from "next/dynamic";

// Recharts is only loaded in the admin, after the page shell renders.
export const TimeChartLazy = dynamic(() => import("./time-chart"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-lavender/60" />,
});
