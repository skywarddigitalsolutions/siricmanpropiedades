import { redirect } from "next/navigation";
import { listAvailableRoles, listUsers, type PanelUser, type UserRole } from "@/lib/api/users";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleUnlessUnavailable } from "@/lib/session/session-error";
import { roleName } from "@/lib/session/user-display";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import StatusBadge from "@/components/admin/ui/StatusBadge/StatusBadge";
import NewUserPanel from "@/components/admin/users/NewUserPanel/NewUserPanel";
import UserRowActions from "@/components/admin/users/UserRowActions/UserRowActions";
import { createUserAction, resetPasswordAction, setActiveAction } from "./actions";
import styles from "./page.module.css";

/** `/admin/usuarios` — admin-only users management (feature 18 T4). */
export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me.roles.includes("admin")) redirect("/admin");

  const token = await getSessionToken();
  let users: PanelUser[] = [];
  let roles: UserRole[] = [];
  let unavailable = false;
  try {
    [users, roles] = await Promise.all([listUsers(token), listAvailableRoles(token)]);
  } catch (error) {
    handleUnlessUnavailable(error);
    unavailable = true;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuarios"
        description="Quién puede entrar al panel, con qué rol y si su cuenta está activa."
      />

      {unavailable ? (
        <FormAlert>No pudimos cargar los usuarios. Intentá de nuevo en unos minutos.</FormAlert>
      ) : (
        <>
          <NewUserPanel roles={roles} action={createUserAction} />
          <ul className={styles.list}>
            {users.map((user) => (
              <li key={user.id} aria-label={user.userName} className={styles.row}>
                <div className={styles.identity}>
                  <span className={styles.name}>{user.userName}</span>
                  {user.id === me.id && <span className={styles.you}>Vos</span>}
                </div>
                <div className={styles.badges}>
                  {user.userRoles.map(({ role }) => (
                    <StatusBadge key={role.id} tone="info">
                      {roleName(role.name)}
                    </StatusBadge>
                  ))}
                  <StatusBadge tone={user.isActive ? "success" : "neutral"}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </StatusBadge>
                </div>
                <UserRowActions
                  key={`${user.id}-${user.isActive}`}
                  userName={user.userName}
                  isActive={user.isActive}
                  isSelf={user.id === me.id}
                  toggleAction={setActiveAction.bind(null, user.id, !user.isActive)}
                  resetAction={resetPasswordAction.bind(null, user.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
