import "server-only";
import { listLeads } from "@/lib/api/leads";
import { INBOX_PATH } from "./inbox-params";

/** Badge counts for the panel nav, keyed by href. Best effort: failures show no badge. */
export async function loadNavBadges(token: string): Promise<Record<string, number>> {
  try {
    const { total } = await listLeads(token, { status: "new", limit: 1 });
    return { [INBOX_PATH]: total };
  } catch {
    return {};
  }
}
