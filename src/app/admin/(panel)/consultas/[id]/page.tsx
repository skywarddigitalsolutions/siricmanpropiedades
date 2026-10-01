import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, Pencil, Phone } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getLead, type Lead } from "@/lib/api/leads";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import type { PropertyType } from "@/lib/properties/enums";
import { leadContactLinks } from "@/lib/leads/contact-links";
import { formatLeadDate, INBOX_PATH } from "@/lib/leads/inbox-params";
import { LEAD_TOPIC_LABELS, LEAD_TYPE_LABELS } from "@/lib/leads/labels";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import { publicSiteHref } from "@/lib/site-url";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import LeadManagePanel from "@/components/admin/leads/LeadManagePanel/LeadManagePanel";
import LeadStatusBadge from "@/components/admin/leads/LeadStatusBadge/LeadStatusBadge";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { deleteLeadAction, updateLeadAction } from "./actions";
import styles from "./page.module.css";

type LeadDetailPageProps = { params: Promise<{ id: string }> };

async function loadLead(token: string, id: string): Promise<Lead> {
  try {
    return await getLead(token, id);
  } catch (error) {
    // 400 = malformed id (the API validates UUIDs), 404 = unknown or deleted.
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    handleSessionError(error);
  }
}

/** Appraisal request data as label/value rows. */
function detailRows(lead: Lead): { label: string; value: string }[] {
  const details = lead.details;
  if (!details) return [];
  const rows: { label: string; value: string }[] = [];
  if (details.propertyType) {
    rows.push({
      label: "Tipo",
      value: PROPERTY_TYPE_LABELS[details.propertyType as PropertyType] ?? details.propertyType,
    });
  }
  if (details.address) rows.push({ label: "Dirección", value: details.address });
  if (details.rooms !== undefined) rows.push({ label: "Ambientes", value: String(details.rooms) });
  if (details.area !== undefined) rows.push({ label: "Superficie aprox.", value: `${details.area} m²` });
  return rows;
}

/** `/admin/consultas/[id]` — one lead: contact actions, content and follow-up. */
export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const token = await getSessionToken();
  const [lead, user] = await Promise.all([loadLead(token, id), getCurrentUser()]);
  const links = leadContactLinks(lead);
  const rows = detailRows(lead);

  return (
    <div className={styles.page}>
      <Link href={INBOX_PATH} className={styles.back}>
        ← Volver a consultas
      </Link>
      <PageHeader
        title={lead.name}
        description={`${LEAD_TYPE_LABELS[lead.type]} · ${formatLeadDate(lead.createdAt)}`}
      />
      <div className={styles.badges}>
        <LeadStatusBadge status={lead.status} />
        <span className={styles.type}>{LEAD_TYPE_LABELS[lead.type]}</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section aria-labelledby="lead-contact" className={styles.card}>
            <h2 id="lead-contact" className={styles.cardTitle}>
              Responder
            </h2>
            <div className={styles.contactActions}>
              {links.call && (
                <a href={links.call} className={styles.contact}>
                  <Phone aria-hidden size={18} />
                  Llamar · {lead.phone}
                </a>
              )}
              {links.whatsapp && (
                <a
                  href={links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.contact} ${styles.whatsapp}`}
                >
                  <WhatsAppIcon size={20} />
                  WhatsApp
                </a>
              )}
              {links.email && (
                <a href={links.email} className={styles.contact}>
                  <Mail aria-hidden size={18} />
                  Email · {lead.email}
                </a>
              )}
            </div>
          </section>

          <section aria-labelledby="lead-message" className={styles.card}>
            <h2 id="lead-message" className={styles.cardTitle}>
              Mensaje
            </h2>
            {lead.topic && <p className={styles.topic}>{LEAD_TOPIC_LABELS[lead.topic]}</p>}
            {lead.message ? (
              <p className={styles.message}>{lead.message}</p>
            ) : (
              <p className={styles.muted}>Sin mensaje.</p>
            )}
            {rows.length > 0 && (
              <dl className={styles.details}>
                {rows.map((row) => (
                  <div key={row.label} className={styles.detail}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {lead.type === "property_inquiry" && (
            <section aria-labelledby="lead-property" className={styles.card}>
              <h2 id="lead-property" className={styles.cardTitle}>
                Propiedad
              </h2>
              {lead.property ? (
                <>
                  <p className={styles.propertyName}>
                    {lead.property.code} · {lead.property.title}
                  </p>
                  <div className={styles.contactActions}>
                    <Link href={`/admin/propiedades/${lead.property.id}`} className={styles.contact}>
                      <Pencil aria-hidden size={16} />
                      Editar propiedad
                    </Link>
                    <a
                      href={publicSiteHref(`/propiedades/${lead.property.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contact}
                    >
                      <ExternalLink aria-hidden size={16} />
                      Ver en el sitio
                    </a>
                  </div>
                </>
              ) : (
                <p className={styles.muted}>La propiedad ya no existe.</p>
              )}
            </section>
          )}
        </div>

        <LeadManagePanel
          status={lead.status}
          notes={lead.notes}
          canDelete={user.roles.includes("admin")}
          updateAction={updateLeadAction.bind(null, lead.id)}
          deleteAction={deleteLeadAction.bind(null, lead.id)}
        />
      </div>
    </div>
  );
}
