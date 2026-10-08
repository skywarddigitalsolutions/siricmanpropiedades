import { Building2, Calculator, House, MessageSquare, type LucideIcon } from "lucide-react";
import { LEAD_CATEGORY_LABELS, type LeadCategory } from "@/lib/leads/category";
import styles from "./LeadCategoryTag.module.css";

export const LEAD_CATEGORY_ICONS: Record<LeadCategory, LucideIcon> = {
  appraisal: Calculator,
  search: House,
  management: Building2,
  other: MessageSquare,
};

/** Small "icon + label" tag naming a lead's category; the color comes from `data-category`. */
export default function LeadCategoryTag({ category }: { category: LeadCategory }) {
  const Icon = LEAD_CATEGORY_ICONS[category];
  return (
    <span className={styles.tag} data-category={category}>
      <Icon aria-hidden size={14} />
      {LEAD_CATEGORY_LABELS[category]}
    </span>
  );
}
