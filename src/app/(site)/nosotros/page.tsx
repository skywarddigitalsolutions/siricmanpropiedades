import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const DESCRIPTION =
  "Más de una década administrando consorcios en CABA y hoy acompañando operaciones de compra, venta y alquiler con servicio cercano, transparente y personalizado.";

export const metadata: Metadata = {
  title: "Nosotros",
  description: DESCRIPTION,
  alternates: { canonical: "/nosotros" },
  openGraph: { type: "website", title: "Nosotros", description: DESCRIPTION, url: "/nosotros" },
};

const VALUES = [
  { title: "Confianza", text: "Honestidad, claridad y responsabilidad en cada operación." },
  { title: "Profesionalismo", text: "Experiencia y conocimiento al servicio de cada cliente." },
  { title: "Atención personalizada", text: "Cada persona, propiedad y necesidad es diferente." },
  { title: "Compromiso", text: "Acompañamos cada proceso de principio a fin." },
  { title: "Transparencia", text: "Comunicamos de forma simple, directa y clara." },
  { title: "Cercanía humana", text: "Relaciones construidas con respeto, escucha y amistad." },
  { title: "Responsabilidad", text: "Seriedad, organización y vocación de servicio." },
];

// Only real people ship here; the design's `[Nombre]` placeholders are intentionally left out.
const TEAM = [
  { name: "Gabriel Siricman", role: "Martillero Público y Corredor Inmobiliario", initials: "GS" },
];

/** `/nosotros` — who we are, mission, vision, values and team. */
export default function AboutPage() {
  return (
    <main className={styles.main}>
      <section className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>NOSOTROS</span>
            <h1 className={styles.title}>
              Once años cuidando propiedades y a las personas que viven en ellas
            </h1>
            <p className={styles.lead}>
              Siricman Propiedades nace de más de una década administrando consorcios en la Ciudad de
              Buenos Aires. Hoy acompañamos operaciones de compra, venta y alquiler con la misma
              cercanía.
            </p>
          </div>
          <div className={styles.logoTile}>
            <Image
              src="/brand/logo-emblem.png"
              alt="Logo Siricman Propiedades"
              width={256}
              height={242}
              sizes="(min-width: 760px) 240px, 55vw"
              className={styles.logoImg}
            />
          </div>
        </div>

        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <span className={styles.eyebrow}>MISIÓN</span>
            <p className={styles.pillarText}>
              Brindar soluciones inmobiliarias y de administración de consorcios con un servicio
              cercano, transparente y personalizado, acompañando a cada cliente con la experiencia y
              la confianza de más de 11 años.
            </p>
          </div>
          <div className={styles.pillar}>
            <span className={styles.eyebrow}>VISIÓN</span>
            <p className={styles.pillarText}>
              Ser una inmobiliaria referente por la calidad humana y profesional de nuestro servicio,
              construyendo relaciones duraderas y respuestas claras, ágiles y confiables.
            </p>
          </div>
        </div>

        <h2 id="about-values" className={styles.heading}>
          Nuestros valores
        </h2>
        <ul className={styles.values} aria-labelledby="about-values">
          {VALUES.map((value) => (
            <li key={value.title} className={styles.value}>
              <span className={styles.valueTitle}>{value.title}</span>
              <span className={styles.valueText}>{value.text}</span>
            </li>
          ))}
        </ul>

        <h2 id="about-team" className={styles.heading}>
          Equipo
        </h2>
        <ul className={styles.team} aria-labelledby="about-team">
          {TEAM.map((member) => (
            <li key={member.name} className={styles.member}>
              <span className={styles.avatar} aria-hidden="true">
                {member.initials}
              </span>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberRole}>{member.role}</span>
            </li>
          ))}
        </ul>

        <div className={styles.cta}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaTitle}>¿Querés vender, alquilar o consultarnos algo?</h2>
            <p className={styles.ctaBody}>Pedí una tasación o escribinos, te respondemos a la brevedad.</p>
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
      </section>
    </main>
  );
}
