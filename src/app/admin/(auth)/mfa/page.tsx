import { redirect } from "next/navigation";
import MfaVerifyForm from "@/components/admin/auth/MfaVerifyForm/MfaVerifyForm";
import { getMfaPendingCookie } from "@/lib/session/cookies";
import { verifyMfaAction } from "./actions";

export default async function MfaVerifyPage() {
  const mfaToken = await getMfaPendingCookie();
  if (!mfaToken) {
    redirect("/admin/login");
  }

  return <MfaVerifyForm action={verifyMfaAction} />;
}
