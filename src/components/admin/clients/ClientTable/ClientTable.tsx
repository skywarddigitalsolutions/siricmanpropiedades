import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { Client } from "@/lib/api/clients";
import { formatClientDate, formatRelativeDate } from "@/lib/clients/clients-params";
import { leadContactLinks } from "@/lib/leads/contact-links";
import { INBOX_PATH } from "@/lib/leads/inbox-params";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import styles from "./ClientTable.module.css";

/** `/admin/consultas` filtered to one person (all statuses). */
function inquiriesHref(email: string): string {
  return `${INBOX_PATH}?${new URLSearchParams({ estado: "todas", q: email }).toString()}`;
}

/**
 * Clients as cards on phones and a table from 960px (same markup, CSS only):
 * who, how to reach them, how many inquiries, the latest one and what about.
 */
export default function ClientTable({ clients, now }: { clients: Client[]; now?: Date }) {
  return (
    <table className={styles.table}>
      <thead className={styles.head}>
        <tr>
          <th scope="col">Cliente</th>
          <th scope="col">Contacto</th>
          <th scope="col">Consultas</th>
          <th scope="col">Última consulta</th>
          <th scope="col">Propiedades</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => {
          const links = leadContactLinks({ ...client, property: null });
          return (
            <tr key={client.email} className={styles.row}>
              <th scope="row" className={styles.who}>
                <span className={styles.name}>{client.name}</span>
                <a href={links.email} className={styles.email}>
                  <Mail aria-hidden size={14} />
                  {client.email}
                </a>
              </th>
              <td className={styles.cell} data-label="Contacto">
                {client.phone ? (
                  <span className={styles.actions}>
                    <span className={styles.phone}>{client.phone}</span>
                    {links.whatsapp && (
                      <a
                        href={links.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.action} ${styles.whatsapp}`}
                      >
                        <WhatsAppIcon size={16} />
                        WhatsApp
                      </a>
                    )}
                    {links.call && (
                      <a href={links.call} className={styles.action}>
                        <Phone aria-hidden size={15} />
                        Llamar
                      </a>
                    )}
                  </span>
                ) : (
                  <span className={styles.muted}>Sin teléfono</span>
                )}
              </td>
              <td className={styles.cell} data-label="Consultas">
                <span className={styles.count}>
                  {client.inquiries} {client.inquiries === 1 ? "consulta" : "consultas"}
                </span>
                <Link href={inquiriesHref(client.email)} className={styles.more}>
                  Ver consultas
                </Link>
              </td>
              <td className={styles.cell} data-label="Última consulta">
                <time dateTime={client.lastInquiryAt} className={styles.relative}>
                  {formatRelativeDate(client.lastInquiryAt, now)}
                </time>
                <span className={styles.absolute}>{formatClientDate(client.lastInquiryAt)}</span>
              </td>
              <td className={styles.cell} data-label="Propiedades">
                {client.properties.length > 0 ? (
                  <span className={styles.chips}>
                    {client.properties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/admin/propiedades/${property.id}`}
                        title={property.title}
                        className={styles.chip}
                      >
                        {property.code}
                      </Link>
                    ))}
                  </span>
                ) : (
                  <span className={styles.muted}>Sin propiedad</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
