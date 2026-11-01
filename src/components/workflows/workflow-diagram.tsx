"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { Check, GitBranch, Pause, Play, RotateCcw } from "lucide-react";
import type { WorkflowStep } from "@/types";
import { track } from "@/lib/analytics/track";
import { STEP_META } from "./step-meta";

interface Props {
  steps: WorkflowStep[];
  title: string;
  /** Start playing automatically when scrolled into view. */
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  /** Analytics label (no PII). */
  scenario?: string;
  stepMs?: number;
  className?: string;
}

/**
 * Accessible animated workflow. Renders as a horizontal flow in wide containers and a vertical
 * stepper in narrow ones (CSS container queries — no layout shift). Initial/SSR state shows the
 * complete workflow, which doubles as the static and reduced-motion fallback.
 */
export function WorkflowDiagram({ steps, title, autoplay = false, loop = false, controls = true, scenario, stepMs = 1500, className }: Props) {
  const n = steps.length;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(n - 1); // complete by default (static fallback)
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  const play = useCallback(
    (restart = false) => {
      setSelected(null);
      setActive((a) => (restart || a >= n - 1 ? 0 : a));
      setPlaying(true);
      track("workflow_demo_started", { scenario });
    },
    [n, scenario],
  );

  // Reset when the scenario changes (tabs / industry selector).
  useEffect(() => {
    setSelected(null);
    if (autoStarted.current && !reduce) {
      setActive(0);
      setPlaying(true);
    } else {
      setActive(n - 1);
      setPlaying(false);
    }
  }, [steps, n, reduce]);

  useEffect(() => {
    if (!autoplay || reduce || !rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !autoStarted.current) {
          autoStarted.current = true;
          setActive(0);
          setPlaying(true);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [autoplay, reduce]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (active < n - 1) setActive(active + 1);
      else if (loop) setActive(0);
      else {
        setPlaying(false);
        track("workflow_demo_completed", { scenario });
      }
    }, active < n - 1 ? stepMs : stepMs * 2);
    return () => clearTimeout(t);
  }, [playing, active, n, loop, stepMs, scenario]);

  const focus = selected ?? active;
  const current = steps[focus];
  const wide = n > 5 ? "@4xl" : "@3xl";

  return (
    <div ref={rootRef} className={clsx("@container", className)}>
      <figure aria-label={title} className="m-0">
        <ol
          className={clsx(
            "flex flex-col",
            wide === "@4xl" ? "@4xl:flex-row @4xl:items-stretch" : "@3xl:flex-row @3xl:items-stretch",
          )}
        >
          {steps.map((step, i) => {
            const state = i < active ? "done" : i === active ? (playing ? "active" : "done") : "pending";
            return (
              <li key={`${step.label}-${i}`} className={clsx("flex flex-col", wide === "@4xl" ? "@4xl:flex-1 @4xl:flex-row" : "@3xl:flex-1 @3xl:flex-row")}>
                <StepNode
                  step={step}
                  index={i}
                  state={state}
                  selected={selected === i}
                  onSelect={() => {
                    setPlaying(false);
                    setSelected(i);
                  }}
                />
                {i < n - 1 && <Connector lit={i < active} flowing={playing && i === active - 1} wide={wide} />}
              </li>
            );
          })}
        </ol>

        <figcaption className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-h-[3rem]">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple">
              Step {focus + 1} of {n} · {STEP_META[current.kind].label}
            </p>
            <p className="mt-1 text-sm text-navy">
              <span className="font-semibold">{current.label}:</span> {current.detail}
            </p>
          </div>
          {controls && (
            <div className="flex shrink-0 gap-2">
              {playing ? (
                <button type="button" className="btn-secondary !px-4 !py-2" onClick={() => setPlaying(false)}>
                  <Pause className="h-4 w-4" aria-hidden /> Pause
                </button>
              ) : (
                <button type="button" className="btn-primary !px-4 !py-2" onClick={() => play()}>
                  <Play className="h-4 w-4" aria-hidden /> Play
                </button>
              )}
              <button type="button" className="btn-secondary !px-4 !py-2" onClick={() => play(true)}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Restart
              </button>
            </div>
          )}
        </figcaption>
      </figure>

      <details className="mt-3 text-sm text-muted">
        <summary className="cursor-pointer rounded font-medium text-navy/80 hover:text-purple">Read this workflow as text</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {steps.map((s, i) => (
            <li key={i}>
              <strong className="text-navy">{s.label}</strong> ({STEP_META[s.kind].label.toLowerCase()}) — {s.detail}
              {s.branches && (
                <ul className="mt-1 list-disc pl-5">
                  {s.branches.map((b) => (
                    <li key={b.label}>
                      In parallel: <strong className="text-navy">{b.label}</strong> — {b.detail}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function StepNode({
  step,
  index,
  state,
  selected,
  onSelect,
}: {
  step: WorkflowStep;
  index: number;
  state: "done" | "active" | "pending";
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = STEP_META[step.kind];
  const Icon = meta.icon;
  const parallel = !!step.branches?.length;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Step ${index + 1}: ${step.label}${parallel ? ", runs in parallel" : ""}. ${state === "pending" ? "Not started" : state === "active" ? "In progress" : "Complete"}`}
      className={clsx(
        "relative flex min-w-0 flex-1 flex-col rounded-2xl border p-3.5 text-left transition-all duration-500",
        parallel ? "border-dashed" : "",
        state === "pending" && "border-line bg-white/70 opacity-70",
        state === "done" && "border-lilac/70 bg-white shadow-card",
        state === "active" && "border-purple bg-white shadow-glow",
        selected && "ring-2 ring-purple ring-offset-2",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={clsx(
            "relative grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors duration-500",
            state === "pending" ? "bg-lavender text-muted" : "bg-gradient-to-br from-purple to-lilac text-white",
          )}
        >
          {state === "active" && <span className="absolute inset-0 animate-ping2 rounded-xl bg-purple/40" aria-hidden />}
          {state === "done" && !parallel ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{parallel ? "Parallel" : meta.label}</span>
      </span>
      <span className="mt-2 text-sm font-semibold leading-snug text-navy">{step.label}</span>
      {parallel && (
        <span className="mt-2 flex flex-col gap-1.5">
          {step.branches!.map((b, bi) => (
            <span
              key={b.label}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-all duration-500",
                state === "pending" ? "border-line text-muted" : "border-lilac/60 bg-lavender/70 text-navy",
              )}
              style={{ transitionDelay: state === "active" ? `${bi * 180}ms` : "0ms" }}
            >
              <GitBranch className="h-3 w-3 text-purple" aria-hidden />
              {b.label}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

function Connector({ lit, flowing, wide }: { lit: boolean; flowing: boolean; wide: "@3xl" | "@4xl" }) {
  const horiz = wide === "@4xl" ? "@4xl:my-auto @4xl:ml-0 @4xl:h-0.5 @4xl:w-6 @5xl:w-8" : "@3xl:my-auto @3xl:ml-0 @3xl:h-0.5 @3xl:w-6 @5xl:w-8";
  return (
    <span aria-hidden className={clsx("relative ml-[1.85rem] h-5 w-0.5 shrink-0 overflow-hidden rounded-full", horiz, lit ? "bg-purple/60" : "bg-line")}>
      {flowing && (
        <>
          <span className={clsx("absolute inset-x-0 top-0 h-1/2 animate-flowY bg-gradient-to-b from-transparent via-white to-transparent", wide === "@4xl" ? "@4xl:hidden" : "@3xl:hidden")} />
          <span className={clsx("absolute inset-y-0 left-0 hidden w-1/2 animate-flow bg-gradient-to-r from-transparent via-white to-transparent", wide === "@4xl" ? "@4xl:block" : "@3xl:block")} />
        </>
      )}
    </span>
  );
}
