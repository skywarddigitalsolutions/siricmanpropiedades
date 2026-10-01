// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decideHostRouting } from "./host-routing";

const adminUrl = "https://admin.example.com";
const siteUrl = "https://example.com";

function decide(host: string, pathname: string, search = "") {
  return decideHostRouting({ host, pathname, search, adminUrl, siteUrl });
}

describe("decideHostRouting", () => {
  it("does nothing when ADMIN_URL is unset", () => {
    expect(
      decideHostRouting({ host: "localhost:3000", pathname: "/admin/x", search: "" }),
    ).toEqual({ action: "next" });
  });

  it("does nothing when ADMIN_URL is not a valid URL", () => {
    expect(
      decideHostRouting({
        host: "example.com",
        pathname: "/admin",
        search: "",
        adminUrl: "not a url",
      }),
    ).toEqual({ action: "next" });
  });

  it.each(["/admin", "/admin/", "/admin/propiedades/12"])(
    "serves %s on the admin host",
    (path) => {
      expect(decide("admin.example.com", path)).toEqual({ action: "next" });
    },
  );

  it("redirects the admin host root to /admin", () => {
    expect(decide("admin.example.com", "/", "?a=1")).toEqual({
      action: "redirect",
      url: "https://admin.example.com/admin",
    });
  });

  it("redirects public paths on the admin host to the site, keeping the query", () => {
    expect(decide("admin.example.com", "/propiedades/casa", "?q=1")).toEqual({
      action: "redirect",
      url: "https://example.com/propiedades/casa?q=1",
    });
    expect(decide("admin.example.com", "/administrador")).toEqual({
      action: "redirect",
      url: "https://example.com/administrador",
    });
  });

  it("redirects /admin on the site host to the admin host, keeping path and query", () => {
    expect(decide("example.com", "/admin/propiedades/3", "?pagina=2")).toEqual({
      action: "redirect",
      url: "https://admin.example.com/admin/propiedades/3?pagina=2",
    });
    expect(decide("example.com", "/admin")).toEqual({
      action: "redirect",
      url: "https://admin.example.com/admin",
    });
  });

  it("redirects /admin on any other host (www) too", () => {
    expect(decide("www.example.com", "/admin/login")).toEqual({
      action: "redirect",
      url: "https://admin.example.com/admin/login",
    });
  });

  it("leaves public paths on the site host alone", () => {
    expect(decide("example.com", "/")).toEqual({ action: "next" });
    expect(decide("example.com", "/administrador")).toEqual({ action: "next" });
  });

  it("compares hosts case-insensitively and ignores a forwarded host list tail", () => {
    expect(decide("ADMIN.Example.com", "/admin")).toEqual({ action: "next" });
    expect(decide("admin.example.com, web:3000", "/admin")).toEqual({ action: "next" });
  });
});
