import type { PublicationStatus } from "@/lib/properties/enums";
import { PUBLICATION_STATUS_LABELS } from "@/lib/properties/labels";
import StatusBadge, { type Tone } from "@/components/admin/ui/StatusBadge/StatusBadge";

type PublicationStatusBadgeProps = {
  status: PublicationStatus;
};

const TONE_BY_STATUS: Record<PublicationStatus, Tone> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

/** Publication-status pill: published = green, draft = amber, archived = grey. */
export default function PublicationStatusBadge({
  status,
}: PublicationStatusBadgeProps) {
  return (
    <StatusBadge tone={TONE_BY_STATUS[status]}>
      {PUBLICATION_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
