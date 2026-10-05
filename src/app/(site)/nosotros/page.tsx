import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ClipboardCheck,
  Compass,
  Eye,
  Handshake,
  Heart,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { BROKER_LICENSE, INSTAGRAM_URL } from "@/lib/contact";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./page.module.css";

const DESCRIPTION =
  "Más de una década administrando consorcios en CABA y hoy acompañando operaciones de compra, venta y alquiler con servicio cercano, transparente y personalizado.";

export const metadata: Metadata = {
  title: "Nosotros",
  description: DESCRIPTION,
  alternates: { canonical: "/nosotros" },
  openGraph: { type: "website", title: "Nosotros", description: DESCRIPTION, url: "/nosotros" },
};

const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    title: "Confianza",
    text: "Honestidad, claridad y responsabilidad en cada operación.",
  },
  {
    icon: Award,
    title: "Profesionalismo",
    text: "Experiencia y conocimiento al servicio de cada cliente.",
  },
  {
    icon: Sparkles,
    title: "Atención personalizada",
    text: "Cada persona, propiedad y necesidad es diferente.",
  },
  {
    icon: Handshake,
    title: "Compromiso",
    text: "Acompañamos cada proceso de principio a fin.",
  },
  { icon: Eye, title: "Transparencia", text: "Comunicamos de forma simple, directa y clara." },
  {
    icon: Heart,
    title: "Cercanía humana",
    text: "Relaciones construidas con respeto, escucha y amistad.",
  },
  {
    icon: ClipboardCheck,
    title: "Responsabilidad",
    text: "Seriedad, organización y vocación de servicio.",
  },
];

// Only real people ship here; the design's `[Nombre]` placeholders are intentionally left out.
const TEAM = [
  {
    name: "Gabriel Siricman",
    role: "Martillero Público y Corredor Inmobiliario",
    license: BROKER_LICENSE,
    photo: "/team/gabriel.jpg",
    bio: "Más de 11 años administrando consorcios en la Ciudad de Buenos Aires. Hoy acompaña operaciones de compra, venta y alquiler con la misma cercanía.",
  },
];

const WHATSAPP_MESSAGE = "Hola Gabriel, te escribo desde la web.";

/** `/nosotros` — who we are, mission, vision, values and team. */
export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className={styles.heroBand}>
        <Image
          src="/brand/logo-emblem.png"
          alt="Logo Siricman Propiedades"
          width={256}
          height={242}
          sizes="(min-width: 760px) 420px, 70vw"
          className={styles.watermark}
        />
        <section className={`${styles.inner} ${styles.hero}`}>
          <span className={styles.eyebrow}>NOSOTROS</span>
          <h1 className={styles.title}>
            Once años cuidando propiedades y a las personas que viven en ellas
          </h1>
          <p className={styles.lead}>
            Siricman Propiedades nace de más de una década administrando consorcios en la Ciudad de
            Buenos Aires. Hoy acompañamos operaciones de compra, venta y alquiler con la misma
            cercanía.
          </p>
        </section>
      </div>

      <div className={`${styles.inner} ${styles.pillars}`}>
        <div className={`${styles.pillar} ${styles.pillarDark}`}>
          <Target aria-hidden size={28} className={styles.pillarIcon} />
          <span className={styles.eyebrowLight}>MISIÓN</span>
          <p className={styles.pillarText}>
            Brindar soluciones inmobiliarias y de administración de consorcios con un servicio
            cercano, transparente y personalizado, acompañando a cada cliente con la experiencia y
            la confianza de más de 11 años.
          </p>
        </div>
        <div className={`${styles.pillar} ${styles.pillarLight}`}>
          <Compass aria-hidden size={28} className={styles.pillarIconDark} />
          <span className={styles.eyebrow}>VISIÓN</span>
          <p className={styles.pillarText}>
            Ser una inmobiliaria referente por la calidad humana y profesional de nuestro servicio,
            construyendo relaciones duraderas y respuestas claras, ágiles y confiables.
          </p>
        </div>
      </div>

      <div className={styles.band}>
        <section className={`${styles.inner} ${styles.block}`}>
          <h2 id="about-values" className={styles.heading}>
            Nuestros valores
          </h2>
          <ul className={styles.values} aria-labelledby="about-values">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={styles.value}>
                <span className={styles.valueIcon}>
                  <Icon aria-hidden size={22} />
                </span>
                <span className={styles.valueTitle}>{title}</span>
                <span className={styles.valueText}>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${styles.inner} ${styles.block}`}>
        <h2 id="about-team" className={styles.heading}>
          Equipo
        </h2>
        <ul className={styles.team} aria-labelledby="about-team">
          {TEAM.map((member) => (
            <li key={member.name} className={styles.member}>
              <span className={styles.avatar}>
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={180}
                  height={180}
                  sizes="(min-width: 1024px) 180px, 132px"
                  className={styles.avatarPhoto}
                />
              </span>
              <div className={styles.memberBody}>
                <span className={styles.memberName}>{member.name}</span>
                <span className={styles.memberRole}>{member.role}</span>
                <span className={styles.memberLicense}>{member.license}</span>
                <p className={styles.memberBio}>{member.bio}</p>
                <div className={styles.memberActions}>
                  <a
                    href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.memberPrimary}
                  >
                    <WhatsAppIcon size={18} />
                    WhatsApp
                  </a>
                  <Link href="/contacto" className={styles.memberSecondary}>
                    Escribinos
                  </Link>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.memberSecondary}
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className={`${styles.inner} ${styles.ctaWrap}`}>
        <div className={styles.cta}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaTitle}>¿Querés vender, alquilar o consultarnos algo?</h2>
            <p className={styles.ctaBody}>
              Pedí una tasación o escribinos, te respondemos a la brevedad.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/tasaciones" className={styles.ctaButton}>
              Solicitar tasación
            </Link>
            <Link href="/contacto" className={styles.ctaLink}>
              Contactanos
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
