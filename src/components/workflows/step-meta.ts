import { Bot, CheckCircle2, Database, Network, UserCheck, Zap, type LucideIcon } from "lucide-react";
import type { StepKind } from "@/types";

export const STEP_META: Record<StepKind, { icon: LucideIcon; label: string }> = {
  trigger: { icon: Zap, label: "Trigger" },
  agent: { icon: Bot, label: "AI agent" },
  supervisor: { icon: Network, label: "Supervisor" },
  system: { icon: Database, label: "Your tools" },
  human: { icon: UserCheck, label: "Human step" },
  outcome: { icon: CheckCircle2, label: "Outcome" },
};

export const STEP_KINDS = Object.keys(STEP_META) as StepKind[];
