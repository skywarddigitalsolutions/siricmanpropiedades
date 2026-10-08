import { BROKER_LICENSE, CONSORTIUM_LICENSE } from "@/lib/contact";

export interface TeamMember {
  name: string;
  role: string;
  /** Professional registration; left out when none was confirmed. */
  license?: string;
  /** Short credentials shown wherever the person is presented (role first). */
  highlights?: readonly string[];
  /** Public path; the source image is 400×400. Without it, an initials avatar is shown. */
  photo?: string;
  /** Shown in the avatar when there is no photo. */
  initials?: string;
  bio: string;
}

/** Years of experience, stated everywhere Gabriel is presented. Revisit here. */
export const FOUNDER_YEARS = 11;

const FOUNDER_TEACHING = "Docente en UTN";
const FOUNDER_EXPERIENCE = `+${FOUNDER_YEARS} años de experiencia`;
const FOUNDER_ROLE = "Martillero Público y Corredor Inmobiliario";

// Only real people ship here; the design's `[Nombre]` placeholders are intentionally left out.
const GABRIEL: TeamMember & { photo: string; license: string; highlights: readonly string[] } = {
  name: "Gabriel Siricman",
  role: FOUNDER_ROLE,
  license: BROKER_LICENSE,
  highlights: [FOUNDER_ROLE, BROKER_LICENSE, FOUNDER_TEACHING, FOUNDER_EXPERIENCE],
  photo: "/team/gabriel.jpg",
  bio: `Más de ${FOUNDER_YEARS} años administrando consorcios en la Ciudad de Buenos Aires. Hoy te acompaña en la venta de tu propiedad y en operaciones de compra, alquiler y administración de alquileres con la misma cercanía.`,
};

const ANA_MARIA: TeamMember = {
  name: "Ana María Fierro Pedrayes",
  role: "Administración de consorcios",
  initials: "AF",
  bio: "15 años de trayectoria en la administración de consorcios en la Ciudad de Buenos Aires. Está a cargo de la administración de los edificios, con trato directo con cada propietario.",
};

export const TEAM: readonly TeamMember[] = [GABRIEL, ANA_MARIA];

/** The agency's founder, featured on the home page and in every selling context. */
export const FOUNDER = GABRIEL;

/** Handles consortium administration only. */
export const CONSORTIUM_ADMIN = ANA_MARIA;

export type FounderVariant = "broker" | "consortium";

/**
 * Gabriel's credentials, role line first. The consortium variant swaps the
 * broker role and license for the consortium administrator registration.
 */
export function founderHighlights(variant: FounderVariant = "broker"): readonly string[] {
  if (variant === "broker") return FOUNDER.highlights;
  return [`Administrador de consorcios · ${CONSORTIUM_LICENSE}`, FOUNDER_TEACHING, FOUNDER_EXPERIENCE];
}
