import LoginForm from "@/components/admin/auth/LoginForm/LoginForm";
import { getSessionNoticeMessage } from "@/components/admin/auth/messages";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const notice =
    reason === "expired" || reason === "forbidden"
      ? getSessionNoticeMessage(reason)
      : undefined;

  return <LoginForm action={loginAction} notice={notice} />;
}
