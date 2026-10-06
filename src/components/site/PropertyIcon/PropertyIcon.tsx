import { Bath, BedDouble, Car, LayoutGrid, Ruler, type LucideProps } from "lucide-react";
import type { SpecIcon } from "@/lib/public/property-view";

const ICONS = {
  area: Ruler,
  rooms: LayoutGrid,
  bedrooms: BedDouble,
  bathrooms: Bath,
  garage: Car,
} satisfies Record<SpecIcon, unknown>;

/** Decorative icon for a property spec; the text next to it carries the meaning. */
export default function PropertyIcon({ name, ...props }: { name: SpecIcon } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden focusable={false} {...props} />;
}
