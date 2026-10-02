import { User } from "lucide-react";
import { initialsOf, roleLabel } from "@/lib/session/user-display";
import styles from "./UserCard.module.css";

type UserCardProps = {
  userName: string;
  roles: readonly string[];
  /** `dark` on the navy sidebar, `light` inside the white drawer. */
  tone?: "dark" | "light";
};

/** Avatar circle (initials, or a user icon as fallback) with the name and role label. */
export default function UserCard({ userName, roles, tone = "light" }: UserCardProps) {
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
    </div>
  );
}
