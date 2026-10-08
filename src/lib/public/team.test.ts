import { describe, expect, it } from "vitest";
import { CONSORTIUM_LICENSE } from "@/lib/contact";
import { CONSORTIUM_ADMIN, FOUNDER, TEAM } from "./team";

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
    expect(CONSORTIUM_ADMIN.credentials).not.toContain(CONSORTIUM_LICENSE);
  });
});
