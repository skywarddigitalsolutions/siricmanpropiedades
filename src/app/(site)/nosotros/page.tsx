import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Compass,
  Eye,
  Handshake,
  Heart,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import FounderCredentials from "@/components/site/team/FounderCredentials/FounderCredentials";
import TeamAvatar from "@/components/site/TeamAvatar/TeamAvatar";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { INSTAGRAM_URL } from "@/lib/contact";
import { CONSORTIUM_ADMIN, FOUNDER, TEAM } from "@/lib/public/team";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./page.module.css";

const DESCRIPTION =
  "Conocé a quienes te atienden en Siricman Propiedades: Gabriel Siricman, corredor inmobiliario matriculado, te acompaña en la venta de tu propiedad, y Ana María Fierro Pedrayes administra consorcios con 15 años de trayectoria.";

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
];

const WHATSAPP_MESSAGE = "Hola Gabriel, te escribo desde la web.";

/** `/nosotros` — who we are, mission, vision, values and team. */
export default function AboutPage() {
  return (
    <main className={styles.main}>
      <section aria-label="Administración de consorcios" className={`${styles.inner} ${styles.admin}`}>
        <div className={`${styles.navy} ${styles.adminCard}`}>
          <div className={styles.adminAvatar}>
            <TeamAvatar member={CONSORTIUM_ADMIN} sizes="72px" />
          </div>
          <div className={styles.adminBody}>
            <span className={styles.eyebrow}>ADMINISTRACIÓN</span>
            <p className={styles.adminName}>{CONSORTIUM_ADMIN.name}</p>
            <p className={styles.adminRole}>Administración de consorcios · 15 años de trayectoria</p>
            <p className={styles.adminText}>Trato directo con cada propietario del edificio.</p>
          </div>
          <Link href="/administracion-de-consorcios" className={styles.adminLink}>
            Conocé la administración de consorcios
            <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </section>

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
          <h1 className={styles.title}>Una inmobiliaria con nombre y apellido</h1>
          <p className={styles.lead}>
            En Siricman Propiedades te atienden las mismas personas de principio a fin: Gabriel
            Siricman te acompaña en la venta de tu propiedad y en cada operación, y Ana María
            Fierro Pedrayes está a cargo de la administración de consorcios.
          </p>
        </section>
      </div>

      <section className={`${styles.inner} ${styles.block}`}>
        <h2 id="about-team" className={styles.heading}>
          Quién está detrás
        </h2>
        <ul className={styles.team} aria-labelledby="about-team">
          {TEAM.map((member) => (
            <li key={member.name} className={styles.member}>
              <span className={styles.avatar}>
                <TeamAvatar
                  member={member}
                  sizes="(min-width: 960px) 200px, 132px"
                  imageClassName={styles.avatarPhoto}
                />
              </span>
              <div className={styles.memberBody}>
                <span className={styles.memberName}>{member.name}</span>
                {member === FOUNDER ? (
                  <FounderCredentials />
                ) : (
                  <span className={styles.memberRole}>{member.role}</span>
                )}
                <p className={styles.memberBio}>{member.bio}</p>
                {member === FOUNDER && (
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
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className={`${styles.inner} ${styles.pillars}`}>
        <div className={`${styles.navy} ${styles.pillar}`}>
          <span className={styles.pillarIcon} aria-hidden="true">
            <Target size={18} />
          </span>
          <span className={styles.eyebrow}>MISIÓN</span>
          <p className={styles.pillarText}>
            Acompañar a cada propietario en la venta de su propiedad con un servicio cercano,
            transparente y profesional, y brindar una administración de alquileres y de consorcios
            ordenada y confiable.
          </p>
        </div>
        <div className={`${styles.pillar} ${styles.pillarLight}`}>
          <span className={styles.pillarIcon} aria-hidden="true">
            <Compass size={18} />
          </span>
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
                <span className={styles.valueIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className={styles.valueBody}>
                  <span className={styles.valueTitle}>{title}</span>
                  <span className={styles.valueText}>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>


      <div className={`${styles.inner} ${styles.ctaWrap}`}>
        <div className={`${styles.navy} ${styles.cta}`}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaTitle}>¿Pensás vender tu propiedad?</h2>
            <p className={styles.ctaBody}>
              Pedí una tasación o escribinos, te respondemos a la brevedad.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/vender" className={styles.ctaButton}>
              Pedí tu tasación
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
