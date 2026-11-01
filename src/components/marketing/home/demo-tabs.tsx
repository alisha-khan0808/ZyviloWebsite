"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import type { WorkflowStep } from "@/types";

const SCENARIOS: { id: string; label: string; summary: string; steps: WorkflowStep[] }[] = [
  {
    id: "lead-to-booking",
    label: "Lead to Booking",
    summary: "A new lead is qualified, saved to your CRM and booked into your calendar — in sequence.",
    steps: [
      { label: "Form", kind: "trigger", detail: "A visitor submits an enquiry form on your website." },
      { label: "Qualification Agent", kind: "agent", detail: "Asks a few friendly questions to understand budget, need and timing." },
      { label: "CRM", kind: "system", detail: "Creates the contact with the answers so nothing is retyped." },
      { label: "Calendar", kind: "system", detail: "Offers available times and books the meeting." },
      { label: "Confirmation", kind: "outcome", detail: "The lead gets a confirmation and your team gets a summary." },
    ],
  },
  {
    id: "customer-support",
    label: "Customer Support",
    summary: "A support agent answers from your knowledge base — or hands over to a person.",
    steps: [
      { label: "Message", kind: "trigger", detail: "A customer asks a question in chat or by email." },
      { label: "Support Agent", kind: "agent", detail: "Understands the question and what the customer needs." },
      { label: "Knowledge Base", kind: "system", detail: "Looks up your approved answers and policies." },
      {
        label: "Answer / Human Escalation",
        kind: "human",
        detail: "Routine questions are answered; sensitive or unusual ones go to your team with the full conversation.",
        branches: [
          { label: "Answer", detail: "Clear, approved answer sent." },
          { label: "Human Escalation", detail: "A person takes over with full context." },
        ],
      },
    ],
  },
  {
    id: "multi-agent-ops",
    label: "Multi-Agent Operations",
    summary: "A supervisor splits the work between specialists who run in parallel, then a person reviews.",
    steps: [
      { label: "Request", kind: "trigger", detail: "A new client request arrives — e.g. 'quote and meeting please'." },
      { label: "Supervisor", kind: "supervisor", detail: "One AI coordinator decides which specialists handle each part." },
      {
        label: "Specialist Agents",
        kind: "agent",
        detail: "Three specialists work at the same time.",
        branches: [
          { label: "Research Agent", detail: "Gathers background." },
          { label: "CRM Agent", detail: "Updates the record." },
          { label: "Scheduling Agent", detail: "Finds meeting times." },
        ],
      },
      { label: "Review", kind: "human", detail: "A team member checks and approves the combined result." },
      { label: "Completion", kind: "outcome", detail: "The client receives the quote and a confirmed meeting." },
    ],
  },
];

export function DemoTabs() {
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = SCENARIOS[tab];

  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (tab + dir + SCENARIOS.length) % SCENARIOS.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="card overflow-hidden p-2 sm:p-3">
      <div role="tablist" aria-label="Demo scenarios" className="flex gap-1 overflow-x-auto rounded-2xl bg-lavender/70 p-1" onKeyDown={onKey}>
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${sc.id}`}
            aria-selected={tab === i}
            aria-controls={`panel-${sc.id}`}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === i ? "bg-white text-purple shadow-card" : "text-navy/70 hover:text-navy",
            )}
          >
            {sc.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`tab-${s.id}`} className="p-3 pt-6 sm:p-6">
        <p className="mb-6 text-muted">{s.summary}</p>
        <WorkflowDiagram key={s.id} steps={s.steps} title={`${s.label} example workflow`} scenario={s.id} autoplay />
        <p className="mt-4 text-xs text-muted">Illustrative example. Diagrams show possible workflows, not live systems or real customer data.</p>
      </div>
    </div>
  );
}
