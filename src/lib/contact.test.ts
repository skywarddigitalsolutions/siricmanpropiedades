import { describe, expect, it } from "vitest";
import {
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  OFFICE_ADDRESS,
  OFFICE_CITY,
  OFFICE_HOURS,
  OFFICE_MAP_QUERY,
  OFFICE_NEIGHBORHOOD,
  PHONE_DISPLAY,
} from "./contact";

describe("office contact data", () => {
  it("keeps the public office details in one place", () => {
    expect(CONTACT_EMAIL).toBe("info@siricmanpropiedades.com.ar");
    expect(OFFICE_ADDRESS).toBe("Las Casas 4054, 1° B");
    expect(OFFICE_NEIGHBORHOOD).toBe("Boedo");
    expect(OFFICE_CITY).toBe("CABA");
    expect(OFFICE_HOURS).toBe("10:30 a 18:00");
    expect(PHONE_DISPLAY).toBe("11 3896-7363");
    expect(INSTAGRAM_HANDLE).toBe("@gabrielsiricman");
    expect(INSTAGRAM_URL).toBe("https://www.instagram.com/gabrielsiricman/");
  });

  it("builds the map query from the address, barrio and city", () => {
    expect(OFFICE_MAP_QUERY).toBe("Las Casas 4054, Boedo, CABA");
  });
});
