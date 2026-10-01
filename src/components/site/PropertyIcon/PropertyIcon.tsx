import {
  Bath,
  BedDouble,
  CalendarDays,
  Car,
  LayoutGrid,
  Receipt,
  Ruler,
  Square,
  type LucideProps,
} from "lucide-react";
import type { FactIcon } from "@/lib/public/property-view";

const ICONS = {
  area: Ruler,
  coveredArea: Square,
  rooms: LayoutGrid,
  bedrooms: BedDouble,
  bathrooms: Bath,
  garage: Car,
  age: CalendarDays,
  expenses: Receipt,
} satisfies Record<FactIcon, unknown>;

/** Decorative icon for a property fact; the text next to it carries the meaning. */
export default function PropertyIcon({ name, ...props }: { name: FactIcon } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden focusable={false} {...props} />;
}
