import { describe, expect, it } from "vitest";
import { makePublicPropertyDetail } from "@/test/fixtures/public-property";
import { agencyJsonLd, propertyJsonLd, serializeJsonLd } from "./structured-data";

const SITE = "https://siricman.com.ar";

describe("propertyJsonLd", () => {
  it("describes the listing with its offer, photos and place", () => {
    expect(propertyJsonLd(makePublicPropertyDetail(), SITE)).toEqual({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "Luminoso 3 ambientes con balcón al frente",
      description: "Departamento muy luminoso.\n\nCerca del subte.",
      url: "https://siricman.com.ar/propiedades/luminoso-3-ambientes-con-balcon",
      datePosted: "2026-09-01T12:00:00.000Z",
      image: ["https://media.test/p1-1.webp"],
      offers: {
        "@type": "Offer",
        price: 185000,
        priceCurrency: "USD",
        businessFunction: "http://purl.org/goodrelations/v1#Sell",
        availability: "https://schema.org/InStock",
      },
      contentLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Gorriti 4800",
          addressLocality: "Palermo",
          addressRegion: "CABA",
          addressCountry: "AR",
        },
      },
    });
  });

  it("marks rents, unavailable offers and hidden addresses", () => {
    const data = propertyJsonLd(
      makePublicPropertyDetail({ operation: "rent", dealStatus: "rented", address: null }),
      SITE,
    );

    expect(data.offers).toMatchObject({
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      availability: "https://schema.org/SoldOut",
    });
    expect(data.contentLocation.address).not.toHaveProperty("streetAddress");
  });
});

describe("agencyJsonLd", () => {
  it("describes the agency", () => {
    expect(agencyJsonLd(SITE)).toMatchObject({
      "@type": "RealEstateAgent",
      name: "Siricman Propiedades",
      url: SITE,
      telephone: "+5491138967363",
      areaServed: "Ciudad Autónoma de Buenos Aires",
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the script tag cannot be closed from the data", () => {
    const json = serializeJsonLd({ name: "</script><b>" });

    expect(json).not.toContain("<");
    expect(json).toBe(String.raw`{"name":"\u003c/script>\u003cb>"}`);
    expect(JSON.parse(json)).toEqual({ name: "</script><b>" });
  });
});
