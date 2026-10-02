import { KeyRound, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session/dal";
import { initialsOf, roleName } from "@/lib/session/user-display";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import PasswordChangeForm from "@/components/admin/account/PasswordChangeForm/PasswordChangeForm";
import BackupCodesPanel from "@/components/admin/account/BackupCodesPanel/BackupCodesPanel";
import StatusBadge from "@/components/admin/ui/StatusBadge/StatusBadge";
import { changePasswordAction, regenerateBackupCodesAction } from "./actions";
import styles from "./page.module.css";

/** `/admin/cuenta` — profile summary, password change and backup codes (feature 18 T3). */
export default async function AccountPage() {
  const user = await getCurrentUser();
  const initials = initialsOf(user.userName);

  return (
    <div className={styles.page}>
      <PageHeader title="Mi cuenta" description="Tu perfil y la seguridad de tu acceso." />

      <section aria-label="Perfil" className={styles.card}>
        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <div className={styles.identity}>
            <span className={styles.name}>{user.userName}</span>
            <span className={styles.roles}>
              {user.roles.map((role) => (
                <StatusBadge key={role} tone="info">
                  {roleName(role)}
                </StatusBadge>
              ))}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="password-title" className={styles.card}>
        <h2 id="password-title" className={styles.cardTitle}>
          <KeyRound aria-hidden size={20} />
          Cambiar contraseña
        </h2>
        <p className={styles.cardIntro}>
          Al cambiarla se cierran tus otras sesiones abiertas; esta sigue activa.
        </p>
        <PasswordChangeForm action={changePasswordAction} />
      </section>

      <section aria-labelledby="backup-title" className={styles.card}>
        <h2 id="backup-title" className={styles.cardTitle}>
          <ShieldCheck aria-hidden size={20} />
          Códigos de respaldo
        </h2>
        <BackupCodesPanel action={regenerateBackupCodesAction} />
      </section>
    </div>
  );
}
