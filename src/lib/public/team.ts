import { BROKER_LICENSE, CONSORTIUM_LICENSE } from "@/lib/contact";

export interface TeamMember {
  name: string;
  role: string;
  /** Professional registration; left out when none was confirmed. */
  license?: string;
  /** Extra credentials confirmed by the person (registrations, teaching). */
  credentials: readonly string[];
  /** Public path; the source image is 400×400. Without it, an initials avatar is shown. */
  photo?: string;
  /** Shown in the avatar when there is no photo. */
  initials?: string;
  bio: string;
}

// Only real people ship here; the design's `[Nombre]` placeholders are intentionally left out.
const GABRIEL: TeamMember & { photo: string; license: string } = {
  name: "Gabriel Siricman",
  role: "Martillero Público y Corredor Inmobiliario",
  license: BROKER_LICENSE,
  credentials: [
    `Administrador de consorcios · ${CONSORTIUM_LICENSE}`,
    "Docente en UTN",
  ],
  photo: "/team/gabriel.jpg",
  bio: "Más de 11 años administrando consorcios en la Ciudad de Buenos Aires. Hoy te acompaña en la venta de tu propiedad y en operaciones de compra, alquiler y administración de alquileres con la misma cercanía.",
};

const ANA_MARIA: TeamMember = {
  name: "Ana María Fierro Pedrayes",
  role: "Administración de consorcios",
  credentials: [],
  initials: "AF",
  bio: "15 años de trayectoria en la administración de consorcios en la Ciudad de Buenos Aires. Está a cargo de la administración de los edificios, con trato directo con cada propietario.",
};

export const TEAM: readonly TeamMember[] = [GABRIEL, ANA_MARIA];

/** The agency's founder, featured on the home page and in every selling context. */
export const FOUNDER = GABRIEL;

/** Handles consortium administration only. */
export const CONSORTIUM_ADMIN = ANA_MARIA;
