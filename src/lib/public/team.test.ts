import { describe, expect, it } from "vitest";
import { CONSORTIUM_ADMIN, FOUNDER, FOUNDER_YEARS, TEAM, founderHighlights } from "./team";

describe("TEAM", () => {
  it("keeps Gabriel as the founder for selling contexts", () => {
    expect(FOUNDER.name).toBe("Gabriel Siricman");
    expect(TEAM[0]).toBe(FOUNDER);
    expect(FOUNDER.photo).toBe("/team/gabriel.jpg");
  });

  it("adds Ana María Fierro Pedrayes as the consortium administrator, without photo or license", () => {
    expect(TEAM).toContain(CONSORTIUM_ADMIN);
    expect(CONSORTIUM_ADMIN.name).toBe("Ana María Fierro Pedrayes");
    expect(CONSORTIUM_ADMIN.role).toBe("Administración de consorcios");
    expect(CONSORTIUM_ADMIN.bio).toBe(
      "15 años de trayectoria en la administración de consorcios en la Ciudad de Buenos Aires. Está a cargo de la administración de los edificios, con trato directo con cada propietario.",
    );
    expect(CONSORTIUM_ADMIN.photo).toBeUndefined();
    expect(CONSORTIUM_ADMIN.license).toBeUndefined();
    expect(CONSORTIUM_ADMIN.initials).toBe("AF");
  });

  it("gives Gabriel a short, ordered list of highlights", () => {
    expect(FOUNDER.highlights).toEqual([
      "Martillero Público y Corredor Inmobiliario",
      "Matrícula N° 10024",
      "Docente en UTN",
      "+11 años de experiencia",
    ]);
  });

  it("keeps the years of experience in one constant", () => {
    expect(FOUNDER_YEARS).toBe(11);
    expect(FOUNDER.highlights).toContain(`+${FOUNDER_YEARS} años de experiencia`);
    expect(FOUNDER.bio).toContain(`${FOUNDER_YEARS} años`);
  });

  it("swaps the broker license for the consortium one in the consortium variant", () => {
    expect(founderHighlights("consortium")).toEqual([
      "Administrador de consorcios · Matrícula RPA N° 12221",
      "Docente en UTN",
      "+11 años de experiencia",
    ]);
    expect(founderHighlights("broker")).toEqual(FOUNDER.highlights);
  });
});
