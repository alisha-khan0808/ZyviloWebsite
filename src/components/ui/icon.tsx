import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Cpu,
  GraduationCap,
  LifeBuoy,
  MessageCircle,
  Network,
  Phone,
  Plane,
  Scale,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  UtensilsCrossed,
  Workflow,
  type LucideProps,
} from "lucide-react";

// Explicit registry keeps the bundle small and lets the CMS reference icons by name.
export const ICONS = {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Cpu,
  GraduationCap,
  LifeBuoy,
  MessageCircle,
  Network,
  Phone,
  Plane,
  Scale,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  UtensilsCrossed,
  Workflow,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <C aria-hidden {...props} />;
}
