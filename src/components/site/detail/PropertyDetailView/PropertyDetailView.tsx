import Link from "next/link";
import {
  Archive,
  ArrowUpDown,
  Check,
  ChevronLeft,
  Cylinder,
  Droplet,
  Drumstick,
  Dumbbell,
  ExternalLink,
  Fence,
  Flame,
  Flower2,
  MapPin,
  Phone,
  ShieldCheck,
  Sun,
  Trees,
  Users,
  WashingMachine,
  WavesLadder,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { FOUNDER } from "@/lib/public/team";
import { OPERATION_LABELS } from "@/lib/properties/labels";
import {
  conditionLabels,
  dealStatusNotice,
  displayTitle,
  expensesLabel,
  inquiryMessage,
  propertyFacts,
  propertyLocation,
  propertyMap,
  propertyMapsHref,
  propertyPriceLabel,
  propertySpecs,
  amenityItems,
  serviceItems,
  type ServiceKey,
  tagLabel,
  whatsappInquiry,
} from "@/lib/public/property-view";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import type { InquiryState } from "@/lib/leads/inquiry-form";
import type { AmenityKey, PublicPropertyDetail } from "@/lib/public/types";
import MapEmbed from "../../MapEmbed/MapEmbed";
import PropertyIcon from "../../PropertyIcon/PropertyIcon";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import ExpandableText from "../ExpandableText/ExpandableText";
import FeatureList from "../FeatureList/FeatureList";
import PropertyGallery from "../PropertyGallery/PropertyGallery";
import PropertyInquiryForm from "../PropertyInquiryForm/PropertyInquiryForm";
import ShareButton from "../ShareButton/ShareButton";
import styles from "./PropertyDetailView.module.css";

const SERVICE_ICONS: Record<ServiceKey, LucideIcon> = {
  water: Droplet,
  naturalGas: Flame,
  sewer: Cylinder,
  electricity: Zap,
  internet: Wifi,
};

const AMENITY_ICONS: Record<AmenityKey, LucideIcon> = {
  pool: WavesLadder,
  gym: Dumbbell,
  grill: Drumstick,
  multipurposeRoom: Users,
  security: ShieldCheck,
  elevator: ArrowUpDown,
  balcony: Fence,
  terrace: Sun,
  garden: Trees,
  patio: Flower2,
  laundry: WashingMachine,
  storage: Archive,
};

const FOUNDER_FIRST_NAME = FOUNDER.name.split(" ")[0];

const STATUS_COPY = {
  reserved: "Hay una reserva en curso; escribinos para saber si sigue disponible.",
  closed: "Esta propiedad ya no está disponible. Escribinos y te mostramos opciones similares.",
};

type PropertyDetailViewProps = {
  property: PublicPropertyDetail;
  /** Sends the inquiry form (bound to this property by the page). Not needed in preview. */
  inquiryAction?: (prev: InquiryState, formData: FormData) => Promise<InquiryState>;
  /**
   * Admin preview of an unpublished listing: same layout and data, but inert,
   * with no inquiry form, no WhatsApp bar and no links out to the public site.
   */
  preview?: boolean;
};

/** Property page body (presentational): gallery, data, inquiry aside and the phone bottom bar. */
export default function PropertyDetailView({
  property,
  inquiryAction,
  preview = false,
}: PropertyDetailViewProps) {
  const title = displayTitle(property.title);
  const price = propertyPriceLabel(property);
  const expenses = expensesLabel(property);
  const location = propertyLocation(property);
  const map = propertyMap(property);
  const status = dealStatusNotice(property);
  const tag = tagLabel(property);
  const conditions = conditionLabels(property);
  const services = serviceItems(property);
  const amenities = amenityItems(property);
  const inquiry = whatsappInquiry(property);
  const specs = propertySpecs(property);
  const paragraphs = (property.description ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className={styles.main}>
      {!preview && (
        <div className={styles.topRow}>
          <Link
            href={buildSearchHref(EMPTY_SEARCH, { operation: property.operation })}
            className={styles.back}
          >
            <ChevronLeft aria-hidden size={18} />
            Ver más propiedades
          </Link>
        </div>
      )}

      <PropertyGallery
        images={property.images}
        title={title}
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
            <div className={styles.priceRow}>
              <span className={styles.price}>{price}</span>
              {!preview && <ShareButton title={title} className={styles.shareButton} />}
            </div>
            {expenses && <span className={styles.expenses}>{expenses}</span>}
            {specs.length > 0 && (
              <ul aria-label="Características principales" className={styles.specs}>
                {specs.map((spec) => (
                  <li key={spec.icon} className={styles.spec}>
                    <PropertyIcon name={spec.icon} size={18} className={styles.specIcon} />
                    <span aria-hidden>{spec.text}</span>
                    <span className="sr-only">{spec.label}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.identity}>
              <h1 className={styles.title}>{title}</h1>
              <span className={styles.location}>
                <MapPin aria-hidden size={15} className={styles.pin} />
                {location.label}
              </span>
            </div>
          </header>

          {paragraphs.length > 0 && (
            <section aria-labelledby="detail-description" className={styles.section}>
              <h2 id="detail-description" className={styles.sectionTitle}>
                Descripción
              </h2>
              <ExpandableText paragraphs={paragraphs} />
            </section>
          )}

          <section aria-labelledby="detail-facts" className={styles.section}>
            <h2 id="detail-facts" className={styles.sectionTitle}>
              Características
            </h2>
            <dl className={styles.facts}>
              {propertyFacts(property).map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
            {conditions.length > 0 && (
              <ul aria-label="Condiciones" className={styles.conditions}>
                {conditions.map((condition) => (
                  <li key={condition} className={styles.condition}>
                    <Check aria-hidden size={18} className={styles.conditionIcon} />
                    {condition}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {amenities.length > 0 && (
            <section aria-labelledby="detail-amenities" className={styles.section}>
              <h2 id="detail-amenities" className={styles.sectionTitle}>
                Comodidades
              </h2>
              <FeatureList
                items={amenities.map((item) => ({ ...item, Icon: AMENITY_ICONS[item.key] }))}
              />
            </section>
          )}

          {services.length > 0 && (
            <section aria-labelledby="detail-services" className={styles.section}>
              <h2 id="detail-services" className={styles.sectionTitle}>
                Servicios
              </h2>
              <FeatureList
                items={services.map((item) => ({ ...item, Icon: SERVICE_ICONS[item.key] }))}
              />
            </section>
          )}

          <section aria-labelledby="detail-location" className={styles.section}>
            <h2 id="detail-location" className={styles.sectionTitle}>
              Ubicación
            </h2>
            {!location.exact && (
              <p className={styles.muted}>
                Te compartimos la dirección exacta cuando coordinemos la visita.
              </p>
            )}
            <MapEmbed
              query={map.query}
              precision={map.precision}
              title="Mapa de la ubicación"
            />
            {!preview && (
              <a
                href={propertyMapsHref(map.query)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                <ExternalLink aria-hidden size={18} />
                Ver en Google Maps
              </a>
            )}
          </section>
        </article>

        <aside id="consulta" aria-labelledby="detail-inquiry" className={styles.aside}>
          <h2 id="detail-inquiry" className={styles.asideTitle}>
            Consultá por esta propiedad
          </h2>
          {preview || !inquiryAction ? (
            <p className={styles.muted}>
              En la vista previa no se envían consultas. Acá van a ver el
              formulario de consulta y las formas de contacto.
            </p>
          ) : (
            <>
              <PropertyInquiryForm
                action={inquiryAction}
                defaultMessage={inquiryMessage(property)}
              />
              {/* Desktop only: on phones the fixed bar carries WhatsApp and the call. */}
              <div className={styles.asideContact}>
                <p className={styles.asideDivider}>o</p>
                <a
                  href={inquiry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.asideWhatsapp}
                >
                  <WhatsAppIcon size={20} />
                  Escribir por WhatsApp
                </a>
                <p className={styles.asidePhone}>
                  ¿Preferís hablar? Llamá a {FOUNDER_FIRST_NAME} al{" "}
                  <a href={PHONE_HREF} className={styles.asidePhoneLink}>
                    {PHONE_DISPLAY}
                  </a>
                </p>
              </div>
            </>
          )}
        </aside>
      </div>

      {!preview && (
      <div role="group" aria-label="Contactar por esta propiedad" className={styles.bottomBar}>
        <div className={styles.bottomPrice}>
          <span className={styles.bottomAmount}>{price}</span>
          {expenses && <span className={styles.bottomExpenses}>{expenses}</span>}
        </div>
        <a
          href={inquiry.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={styles.bottomWhatsapp}
        >
          <WhatsAppIcon size={24} />
        </a>
        <a href={PHONE_HREF} aria-label="Llamar" className={styles.bottomCall}>
          <Phone aria-hidden size={22} />
        </a>
      </div>
      )}
    </main>
  );
}
