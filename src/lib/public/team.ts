import { BROKER_LICENSE, CONSORTIUM_LICENSE } from "@/lib/contact";

export interface TeamMember {
  name: string;
  role: string;
  license: string;
  /** Extra credentials confirmed by the person (registrations, teaching). */
  credentials: readonly string[];
  /** Public path; the source image is 400×400. */
  photo: string;
  bio: string;
}

// Only real people ship here; the design's `[Nombre]` placeholders are intentionally left out.
export const TEAM: readonly TeamMember[] = [
  {
    name: "Gabriel Siricman",
    role: "Martillero Público y Corredor Inmobiliario",
    license: BROKER_LICENSE,
    credentials: [`Administrador de consorcios · ${CONSORTIUM_LICENSE}`, "Docente en UTN"],
    photo: "/team/gabriel.jpg",
    bio: "Más de 11 años administrando consorcios en la Ciudad de Buenos Aires. Hoy acompaña operaciones de compra, venta y alquiler con la misma cercanía.",
  },
];

/** The agency's founder, featured on the home page. */
export const FOUNDER: TeamMember = TEAM[0];
