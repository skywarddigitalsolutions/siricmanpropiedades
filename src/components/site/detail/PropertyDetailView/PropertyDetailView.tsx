import Link from "next/link";
import { Check, ChevronLeft, MapPin } from "lucide-react";
import { OPERATION_LABELS } from "@/lib/properties/labels";
import {
  conditionLabels,
  dealStatusNotice,
  expensesLabel,
  propertyFacts,
  propertyLocation,
  propertyMap,
  propertyPriceLabel,
  serviceLabels,
  tagLabel,
  whatsappInquiry,
} from "@/lib/public/property-view";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import type { InquiryState } from "@/lib/leads/inquiry-form";
import type { PublicPropertyDetail } from "@/lib/public/types";
import MapEmbed from "../../MapEmbed/MapEmbed";
import PropertyIcon from "../../PropertyIcon/PropertyIcon";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import PropertyGallery from "../PropertyGallery/PropertyGallery";
import PropertyInquiryForm from "../PropertyInquiryForm/PropertyInquiryForm";
import styles from "./PropertyDetailView.module.css";

const STATUS_COPY = {
  reserved: "Hay una reserva en curso; escribinos para saber si sigue disponible.",
  closed: "Esta propiedad ya no está disponible. Escribinos y te mostramos opciones similares.",
};

type PropertyDetailViewProps = {
  property: PublicPropertyDetail;
  /** Sends the inquiry form (bound to this property by the page). */
  inquiryAction: (prev: InquiryState, formData: FormData) => Promise<InquiryState>;
};

/** Property page body (presentational): gallery, data, inquiry aside and the phone bottom bar. */
export default function PropertyDetailView({ property, inquiryAction }: PropertyDetailViewProps) {
  const price = propertyPriceLabel(property);
  const expenses = expensesLabel(property);
  const location = propertyLocation(property);
  const map = propertyMap(property);
  const status = dealStatusNotice(property);
  const tag = tagLabel(property);
  const conditions = conditionLabels(property);
  const services = serviceLabels(property);
  const inquiry = whatsappInquiry(property);
  const paragraphs = (property.description ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className={styles.main}>
      <div className={styles.topRow}>
        <Link
          href={buildSearchHref(EMPTY_SEARCH, { operation: property.operation })}
          className={styles.back}
        >
          <ChevronLeft aria-hidden size={18} />
          Ver más propiedades
        </Link>
        <span className={styles.code}>Cód. {property.code}</span>
      </div>

      <PropertyGallery
        images={property.images}
        title={property.title}
        overlay={
          <>
            <span className={styles.badge}>{OPERATION_LABELS[property.operation]}</span>
            {tag && <span className={`${styles.badge} ${styles.tag}`}>{tag}</span>}
          </>
        }
      />

      <div className={styles.layout}>
        <article className={styles.content}>
          {status && (
            <p role="note" className={styles.notice} data-tone={status.tone}>
              <strong>{status.label}.</strong> {STATUS_COPY[status.tone]}
            </p>
          )}

          <header className={styles.heading}>
            <span className={styles.price}>{price}</span>
            {expenses && <span className={styles.expenses}>{expenses}</span>}
            <h1 className={styles.title}>{property.title}</h1>
            <span className={styles.location}>
              <MapPin aria-hidden size={15} className={styles.pin} />
              {location.label}
            </span>
          </header>

          <ul aria-label="Características" className={styles.facts}>
            {propertyFacts(property).map((fact) => (
              <li key={fact.label} className={styles.fact}>
                <span className={styles.factIcon}>
                  <PropertyIcon name={fact.icon} size={18} />
                </span>
                <span className={styles.factText}>
                  <span className={styles.factLabel}>{fact.label}</span>
                  <span className={styles.factValue}>{fact.value}</span>
                </span>
              </li>
            ))}
          </ul>

          {conditions.length > 0 && (
            <ul aria-label="Condiciones" className={styles.conditions}>
              {conditions.map((condition) => (
                <li key={condition} className={styles.condition}>
                  <Check aria-hidden size={14} />
                  {condition}
                </li>
              ))}
            </ul>
          )}

          {paragraphs.length > 0 && (
            <section aria-labelledby="detail-description" className={styles.card}>
              <h2 id="detail-description" className={styles.cardTitle}>
                Descripción
              </h2>
              {paragraphs.map((paragraph, position) => (
                <p key={position} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {services.length > 0 && (
            <section aria-labelledby="detail-services" className={styles.card}>
              <h2 id="detail-services" className={styles.cardTitle}>
                Servicios
              </h2>
              <ul className={styles.chips}>
                {services.map((service) => (
                  <li key={service} className={styles.chip}>
                    {service}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="detail-location" className={styles.card}>
            <h2 id="detail-location" className={styles.cardTitle}>
              Ubicación
            </h2>
            <MapEmbed
              query={map.query}
              precision={map.precision}
              label={map.label}
              title="Mapa de la ubicación"
            />
            {!location.exact && (
              <p className={styles.muted}>
                Te compartimos la dirección exacta cuando coordinemos la visita.
              </p>
            )}
          </section>
        </article>

        <aside id="consulta" aria-labelledby="detail-inquiry" className={styles.aside}>
          <h2 id="detail-inquiry" className={styles.asideTitle}>
            Consultá por esta propiedad
          </h2>
          <PropertyInquiryForm
            action={inquiryAction}
            defaultMessage={inquiry.message}
            whatsappHref={inquiry.href}
          />
        </aside>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomPrice}>
          <span className={styles.bottomAmount}>{price}</span>
          <span className={styles.bottomCode}>Cód. {property.code}</span>
        </div>
        <a
          href={inquiry.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Consultar por WhatsApp"
          className={styles.bottomWhatsapp}
        >
          <WhatsAppIcon size={26} />
        </a>
        <a href="#consulta" className={styles.bottomCta}>
          Consultar
        </a>
      </div>
    </main>
  );
}
