import { redirect } from "next/navigation";
import MfaEnrollment from "@/components/admin/auth/MfaEnrollment/MfaEnrollment";
import { getSetupPendingCookie } from "@/lib/session/cookies";
import { confirmMfaAction, enableMfaAction } from "./actions";

export default async function MfaSetupPage() {
  const setupToken = await getSetupPendingCookie();
  if (!setupToken) {
    redirect("/admin/login");
  }

  return (
    <MfaEnrollment
      enableMfaAction={enableMfaAction}
      confirmMfaAction={confirmMfaAction}
    />
  );
}
