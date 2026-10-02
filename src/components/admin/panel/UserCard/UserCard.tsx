import Link from "next/link";
import { Settings, User } from "lucide-react";
import { initialsOf, roleLabel } from "@/lib/session/user-display";
import styles from "./UserCard.module.css";

type UserCardProps = {
  userName: string;
  roles: readonly string[];
  /** `dark` on the navy sidebar, `light` inside the white drawer. */
  tone?: "dark" | "light";
  /** Adds a gear link to the account page on the right. */
  accountHref?: string;
  /** Marks the gear as the current page. */
  accountActive?: boolean;
};

/** Avatar circle (initials, or a user icon as fallback), the name and role label, and an optional account gear. */
export default function UserCard({
  userName,
  roles,
  tone = "light",
  accountHref,
  accountActive = false,
}: UserCardProps) {
  const initials = initialsOf(userName);
  const role = roleLabel(roles);

  return (
    <div className={styles.card} data-tone={tone}>
      <span className={styles.avatar}>
        {initials ? initials : <User aria-hidden size={20} />}
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{userName}</span>
        {role && <span className={styles.role}>{role}</span>}
      </span>
      {accountHref && (
        <Link
          href={accountHref}
          aria-label="Mi cuenta"
          aria-current={accountActive ? "page" : undefined}
          className={styles.gear}
        >
          <Settings aria-hidden size={20} />
        </Link>
      )}
    </div>
  );
}
