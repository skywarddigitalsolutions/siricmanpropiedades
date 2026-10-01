import type { DealStatus } from "@/lib/properties/enums";
import { DEAL_STATUS_LABELS } from "@/lib/properties/labels";
import StatusBadge, { type Tone } from "@/components/admin/ui/StatusBadge/StatusBadge";

type DealStatusBadgeProps = {
  status: DealStatus;
};

const TONE_BY_STATUS: Record<DealStatus, Tone> = {
  available: "success",
  reserved: "warning",
  sold: "danger",
  rented: "info",
};

/** Deal-status pill: available = green, reserved = amber, sold = red, rented = blue. */
export default function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <StatusBadge tone={TONE_BY_STATUS[status]}>
      {DEAL_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
