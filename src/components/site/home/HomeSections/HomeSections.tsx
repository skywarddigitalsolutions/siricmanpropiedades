import Link from "next/link";
import { ArrowRight, Building2, ChartLine, House, KeyRound } from "lucide-react";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import styles from "./HomeSections.module.css";

// Provisional copy: edit here.
const SERVICES_EYEBROW = "SERVICIOS";
const SERVICES_TITLE = "Todo lo que necesitás, en un solo lugar";
const SERVICES_LEAD =
  "Compramos, vendemos, alquilamos y administramos. Un mismo equipo en cada paso.";
const SERVICES = [
  {
    icon: KeyRound,
    title: "Comprar",
    text: "Te acompañamos en la búsqueda, la negociación y la escritura.",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "sale" }),
  },
  {
    icon: House,
    title: "Alquilar",
    text: "Contratos claros y gestión ordenada, para inquilinos y propietarios.",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "rent" }),
  },
  {
    icon: ChartLine,
    title: "Vender o tasar",
    text: "Tasación profesional y un plan de difusión para tu propiedad.",
    href: "/tasaciones",
  },
  {
    icon: Building2,
    title: "Administración de consorcios",
    text: "Administración integral de edificios en CABA, con más de 11 años de trayectoria.",
    href: "/administracion-de-consorcios",
  },
];

const SERVICES_TITLE_ID = "services-title";

/**
 * Home services: an intro and a hairline-separated list of full-row links,
 * one per service. The last row (consortium administration, not covered
 * elsewhere on the home) is highlighted. Server component.
 *
 * DOM order (intro, list) is the mobile reading order; from 960px the intro
 * sits on the left and the list on the right.
 */
export function ServicesGrid() {
  return (
    <section className={styles.services} aria-labelledby={SERVICES_TITLE_ID}>
      <div className={styles.servicesInner}>
        <div>
          <p className={styles.servicesEyebrow}>{SERVICES_EYEBROW}</p>
          <h2 id={SERVICES_TITLE_ID} className={styles.servicesTitle}>
            {SERVICES_TITLE}
          </h2>
          <p className={styles.servicesLead}>{SERVICES_LEAD}</p>
        </div>

        <ul className={styles.serviceList}>
          {SERVICES.map(({ icon: Icon, title, text, href }) => (
            <li key={title} className={styles.serviceItem}>
              <Link href={href} className={styles.service}>
                <span className={styles.serviceMarker}>
                  <Icon aria-hidden size={20} />
                </span>
                <div className={styles.serviceText}>
                  <h3 className={styles.serviceTitle}>{title}</h3>
                  <p className={styles.serviceBody}>{text}</p>
                </div>
                <ArrowRight aria-hidden size={20} className={styles.serviceArrow} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
