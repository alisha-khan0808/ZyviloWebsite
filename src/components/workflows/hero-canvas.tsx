"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { Bot, CalendarCheck, Check, Database, MailCheck, MessageSquare, type LucideIcon } from "lucide-react";

interface HeroNode {
  label: string;
  tip: string;
  icon: LucideIcon;
  x: number; // viewBox coordinates (500 × 420)
  y: number;
}

const NODES: HeroNode[] = [
  { label: "Customer Enquiry", tip: "“Do you have a slot on Saturday?”", icon: MessageSquare, x: 120, y: 58 },
  { label: "AI Agent", tip: "Understands the request and replies instantly", icon: Bot, x: 370, y: 120 },
  { label: "CRM", tip: "Saves the contact and conversation", icon: Database, x: 128, y: 208 },
  { label: "Booking", tip: "Finds a free slot and books it", icon: CalendarCheck, x: 372, y: 292 },
  { label: "Confirmation", tip: "Customer gets a confirmation message", icon: MailCheck, x: 150, y: 368 },
];

const W = 500;
const H = 420;

function pathBetween(a: HeroNode, b: HeroNode) {
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
}

/** Floating hero workflow canvas: Customer Enquiry → AI Agent → CRM → Booking → Confirmation. */
export function HeroCanvas() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(NODES.length); // all complete = static fallback
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      setStarted(true);
      setActive(0);
    }, 700);
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setActive((a) => (a >= NODES.length ? 0 : a + 1)), active >= NODES.length ? 2600 : 1500);
    return () => clearTimeout(t);
  }, [active, started]);

  const caption = active < NODES.length ? NODES[active] : null;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-lilac/40 via-purple/10 to-transparent blur-3xl" aria-hidden />
      <figure
        className="relative overflow-hidden rounded-[2rem] glass shadow-[0_30px_80px_-30px_rgba(76,29,149,0.35)]"
        aria-label="Example automation: a customer enquiry is answered by an AI agent, saved to the CRM, booked and confirmed."
      >
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </div>
          <span className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Illustrative workflow
          </span>
        </div>

        {/* Desktop / tablet canvas */}
        <div className="relative hidden aspect-[500/420] grid-dots sm:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7300FF" />
                <stop offset="1" stopColor="#B89CFF" />
              </linearGradient>
            </defs>
            {NODES.slice(0, -1).map((n, i) => {
              const d = pathBetween(n, NODES[i + 1]);
              const lit = active > i;
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="#E8DFF5" strokeWidth={3} strokeLinecap="round" />
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#hero-line)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={lit ? 0 : 1}
                    style={{ transition: "stroke-dashoffset 0.9s ease" }}
                  />
                  {started && active === i + 1 && <Pulse d={d} />}
                </g>
              );
            })}
          </svg>
          {NODES.map((node, i) => {
            const state = i < active ? "done" : i === active ? "active" : "pending";
            const Icon = node.icon;
            return (
              <div
                key={node.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(node.x / W) * 100}%`, top: `${(node.y / H) * 100}%` }}
              >
                <div
                  className={clsx(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-2xl border bg-white px-3 py-2.5 shadow-card transition-all duration-500",
                    state === "active" && "scale-105 border-purple shadow-glow",
                    state === "done" && "border-lilac/70",
                    state === "pending" && "border-line opacity-60",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-8 w-8 place-items-center rounded-xl transition-colors duration-500",
                      state === "pending" ? "bg-lavender text-muted" : "bg-gradient-to-br from-purple to-lilac text-white",
                    )}
                  >
                    {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                  </span>
                  <span className="text-sm font-semibold text-navy">{node.label}</span>
                </div>
                {state === "active" && (
                  <div
                    role="note"
                    className="absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-center text-xs leading-snug text-white shadow-lg"
                  >
                    {node.tip}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: compact vertical stepper */}
        <ol className="space-y-2 p-4 sm:hidden">
          {NODES.map((node, i) => {
            const state = i < active ? "done" : i === active ? "active" : "pending";
            const Icon = node.icon;
            return (
              <li
                key={node.label}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 transition-all duration-500",
                  state === "active" ? "border-purple shadow-glow" : state === "done" ? "border-lilac/70" : "border-line opacity-60",
                )}
              >
                <span className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-xl", state === "pending" ? "bg-lavender text-muted" : "bg-gradient-to-br from-purple to-lilac text-white")}>
                  {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{node.label}</span>
                  <span className="block text-xs text-muted">{node.tip}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="sr-only" aria-live="polite">
          {caption ? `${caption.label}: ${caption.tip}` : ""}
        </p>
      </figure>
    </div>
  );
}

function Pulse({ d }: { d: string }) {
  const ref = useRef<SVGAnimateMotionElement>(null);
  useLayoutEffect(() => {
    ref.current?.beginElement();
  }, []);
  return (
    <circle r={6} fill="#7300FF" opacity={0.9}>
      <animateMotion ref={ref} dur="1s" begin="indefinite" fill="freeze" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
    </circle>
  );
}
