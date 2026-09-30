import type { ReactNode } from "react";
import AuthCard from "@/components/admin/auth/AuthCard/AuthCard";

export default function AdminAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthCard>{children}</AuthCard>;
}
