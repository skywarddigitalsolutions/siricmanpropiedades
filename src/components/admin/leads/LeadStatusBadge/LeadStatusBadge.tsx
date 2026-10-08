import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/labels";
import StatusBadge, { type Tone } from "@/components/admin/ui/StatusBadge/StatusBadge";

const TONE_BY_STATUS: Record<LeadStatus, Tone> = {
  new: "info",
  contacted: "warning",
  closed: "success",
};

/** Lead status pill; the text carries the meaning, color only reinforces it. */
export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <StatusBadge tone={TONE_BY_STATUS[status]}>{LEAD_STATUS_LABELS[status]}</StatusBadge>;
}
