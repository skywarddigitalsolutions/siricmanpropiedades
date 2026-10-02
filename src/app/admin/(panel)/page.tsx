import { CircleCheck, ImageOff, Inbox, PencilLine } from "lucide-react";
import { getDashboard, type DashboardSummary } from "@/lib/api/dashboard";
import { buildInboxHref } from "@/lib/leads/inbox-params";
import { buildPropertyListHref } from "@/lib/properties/list-params";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleUnlessUnavailable } from "@/lib/session/session-error";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import LatestLeads from "@/components/admin/dashboard/LatestLeads";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import styles from "./page.module.css";

/**
 * `/admin` home (feature 18 T2): greeting, the numbers that need attention
 * (new leads, drafts, published listings without photos), the latest leads and
 * quick actions. The summary is best effort: if the API is down the greeting
 * and the shortcuts still render, with a notice instead of the numbers.
 */
export default async function AdminPanelPage() {
  const user = await getCurrentUser();
  const token = await getSessionToken();

  let summary: DashboardSummary | undefined;
  try {
    summary = await getDashboard(token);
  } catch (error) {
    handleUnlessUnavailable(error);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Hola, ${user.userName}`}
        description="Esto es lo que pasa hoy en Siricman Propiedades."
      />

      {summary ? (
        <>
          <div className={styles.kpis}>
            <KpiCard
              href={buildInboxHref({ status: "new", page: 1 })}
              label="Consultas nuevas"
              value={summary.leads.new}
              icon={Inbox}
              tone="info"
            />
            <KpiCard
              href={buildPropertyListHref({ publicationStatus: "draft" }, 1)}
              label="Borradores"
              value={summary.properties.draft}
              icon={PencilLine}
              tone="warning"
            />
            <KpiCard
              href={buildPropertyListHref({ publicationStatus: "published", hasImages: false }, 1)}
              label="Publicadas sin fotos"
              value={summary.properties.publishedWithoutImages}
              icon={ImageOff}
              tone={summary.properties.publishedWithoutImages > 0 ? "danger" : "neutral"}
            />
            <KpiCard
              href={buildPropertyListHref({ publicationStatus: "published" }, 1)}
              label="Publicadas"
              value={summary.properties.published}
              icon={CircleCheck}
              tone="success"
            />
          </div>
          <div className={styles.columns}>
            <LatestLeads leads={summary.latestLeads} />
            <QuickActions />
          </div>
        </>
      ) : (
        <>
          <FormAlert>
            No pudimos cargar el resumen. Intentá de nuevo en unos minutos.
          </FormAlert>
          <QuickActions />
        </>
      )}
    </div>
  );
}
