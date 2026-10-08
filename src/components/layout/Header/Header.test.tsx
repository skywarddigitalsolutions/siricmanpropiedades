import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const nav = vi.hoisted(() => ({
  pathname: "/",
  search: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.search,
}));

import Header from "./Header";
import { PHONE_HREF } from "@/lib/contact";
import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("shows the transparent emblem as the brand logo", () => {
    render(<Header />);

    const logo = screen.getByRole("img", { name: "Siricman Propiedades" });
    expect(logo.getAttribute("src")).toContain("logo-emblem");
  });

  it("renders the desktop navigation links with the correct hrefs", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Vender" })).toHaveAttribute(
      "href",
      "/vender",
    );
    expect(screen.getByRole("link", { name: "Propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
    const rentals = screen.getByRole("link", { name: "Alquileres" });
    expect(rentals).toHaveAttribute("href", "/administracion-de-alquileres");
    expect(rentals).toHaveAttribute("title", "Administración de alquileres");
    expect(screen.getByRole("link", { name: "Consorcios" })).toHaveAttribute(
      "href",
      "/administracion-de-consorcios",
    );
    expect(screen.getByRole("link", { name: "Nosotros" })).toHaveAttribute(
      "href",
      "/nosotros",
    );
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute(
      "href",
      "/contacto",
    );
  });

  it("opens and closes the mobile menu when the toggle buttons are clicked", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: "Menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const closeButton = within(dialog).getByRole("button", { name: "Cerrar" });
    await user.click(closeButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Menú" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("Header actions", () => {
  it("shows only the brand, the sections and the appraisal CTA as links in the bar", () => {
    render(<Header />);

    const names = within(screen.getByRole("banner"))
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());
    expect(names).toEqual([
      expect.stringContaining("SIRICMAN"),
      "Inicio",
      "Vender",
      "Propiedades",
      "Alquileres",
      "Consorcios",
      "Nosotros",
      "Contacto",
      "Tasá tu propiedad",
    ]);
    expect(screen.getByRole("link", { name: "Tasá tu propiedad" })).toHaveAttribute("href", "/vender");
    expect(screen.getByRole("button", { name: "Menú" })).toBeInTheDocument();
  });
});

describe("Header accessibility", () => {
  it("marks the current section with aria-current in the desktop nav", () => {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    render(<Header />);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Contacto" })).not.toHaveAttribute("aria-current");
  });

  it("marks Propiedades as current on any property search path", () => {
    nav.pathname = "/propiedades";
    nav.search = new URLSearchParams("operacion=alquiler");
    render(<Header />);

    expect(screen.getByRole("link", { name: "Propiedades" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Vender" })).not.toHaveAttribute("aria-current");
  });

  it("marks Vender as current on /vender and on the legacy /tasaciones path", () => {
    for (const pathname of ["/vender", "/tasaciones"]) {
      nav.pathname = pathname;
      nav.search = new URLSearchParams();
      render(<Header />);
      expect(screen.getByRole("link", { name: "Vender" })).toHaveAttribute("aria-current", "page");
      cleanup();
    }
  });

  it("opens the mobile menu as a modal dialog and returns focus to the menu button", async () => {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: "Menú" });
    await user.click(menuButton);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cerrar" }));

    expect(close).toHaveBeenCalled();
    expect(menuButton).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("marks the current page inside the mobile menu too", async () => {
    nav.pathname = "/contacto";
    nav.search = new URLSearchParams();
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Menú" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Contacto" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("Header mobile menu content", () => {
  async function openMenu() {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole("button", { name: "Menú" }));
    return { user, dialog: screen.getByRole("dialog") };
  }

  it("shows the brand lockup linking home in the menu top bar", async () => {
    const { dialog } = await openMenu();

    const logo = within(dialog).getByRole("img", { name: "Siricman Propiedades" });
    expect(logo.getAttribute("src")).toContain("logo-emblem");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
    expect(within(dialog).getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("keeps the seven sections and the appraisal CTA in order", async () => {
    const { dialog } = await openMenu();

    const names = within(dialog)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());
    expect(names).toEqual([
      expect.stringContaining("SIRICMAN"),
      "Inicio",
      "Vender",
      "Propiedades",
      "Administración de alquileres",
      "Consorcios",
      "Nosotros",
      "Contacto",
      "Tasá tu propiedad",
      "WhatsApp",
      "Llamar",
    ]);
  });

  it("offers a WhatsApp action that opens the shared chat link in a new tab", async () => {
    const { dialog } = await openMenu();

    const whatsapp = within(dialog).getByRole("link", { name: "WhatsApp" });
    expect(whatsapp).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE),
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp.getAttribute("rel")).toContain("noopener");
    expect(whatsapp.getAttribute("rel")).toContain("noreferrer");
  });

  it("offers a call action that dials the office phone", async () => {
    const { dialog } = await openMenu();

    expect(within(dialog).getByRole("link", { name: "Llamar" })).toHaveAttribute(
      "href",
      PHONE_HREF,
    );
  });

  it.each(["WhatsApp", "Llamar"])("closes the menu when %s is clicked", async (name) => {
    const { user, dialog } = await openMenu();
    const link = within(dialog).getByRole("link", { name });
    // jsdom cannot navigate to wa.me or tel:; only the menu state matters here.
    link.addEventListener("click", (event) => event.preventDefault());

    await user.click(link);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menú" })).toHaveAttribute("aria-expanded", "false");
  });

  it("no longer shows the office address and hours", async () => {
    const { dialog } = await openMenu();

    expect(within(dialog).queryByText(/Las Casas/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/cita previa/)).not.toBeInTheDocument();
  });
});

describe("Header glass variant over the home hero", () => {
  function setScrollY(value: number) {
    Object.defineProperty(window, "scrollY", { value, configurable: true, writable: true });
  }

  afterEach(() => setScrollY(0));

  it("is glass on the home page while at the top", () => {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    setScrollY(0);
    render(<Header />);

    expect(screen.getByRole("banner")).toHaveAttribute("data-variant", "glass");
  });

  it("returns to the solid style once the visitor scrolls down", () => {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    setScrollY(0);
    render(<Header />);

    act(() => {
      setScrollY(120);
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-variant", "glass");

    act(() => {
      setScrollY(0);
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).toHaveAttribute("data-variant", "glass");
  });

  it("starts solid when the home page loads already scrolled", () => {
    nav.pathname = "/";
    nav.search = new URLSearchParams();
    setScrollY(300);
    render(<Header />);

    expect(screen.getByRole("banner")).not.toHaveAttribute("data-variant", "glass");
  });

  it("is never glass on other pages", () => {
    nav.pathname = "/propiedades";
    nav.search = new URLSearchParams();
    setScrollY(0);
    render(<Header />);

    expect(screen.getByRole("banner")).not.toHaveAttribute("data-variant", "glass");
    act(() => {
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-variant", "glass");
  });
});

describe("Header hide on scroll", () => {
  let frames: FrameRequestCallback[] = [];

  function setScrollY(value: number) {
    Object.defineProperty(window, "scrollY", { value, configurable: true, writable: true });
  }

  function scrollTo(y: number) {
    act(() => {
      setScrollY(y);
      fireEvent.scroll(window);
    });
    act(() => {
      const pending = frames;
      frames = [];
      pending.forEach((cb) => cb(performance.now()));
    });
  }

  function renderAt(pathname = "/propiedades") {
    nav.pathname = pathname;
    nav.search = new URLSearchParams();
    setScrollY(0);
    render(<Header />);
    return screen.getByRole("banner");
  }

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setScrollY(0);
  });

  it("hides when scrolling down past its height and shows again when scrolling up", () => {
    const banner = renderAt();
    expect(banner).not.toHaveAttribute("data-hidden");

    scrollTo(300);
    expect(banner).toHaveAttribute("data-hidden");
    expect(document.documentElement).toHaveAttribute("data-header-hidden");

    scrollTo(260);
    expect(banner).not.toHaveAttribute("data-hidden");
    expect(document.documentElement).not.toHaveAttribute("data-header-hidden");
  });

  it("ignores tiny upward movements below the threshold", () => {
    const banner = renderAt();
    scrollTo(300);
    scrollTo(296);
    expect(banner).toHaveAttribute("data-hidden");
  });

  it("stays visible near the top", () => {
    const banner = renderAt();
    scrollTo(40);
    expect(banner).not.toHaveAttribute("data-hidden");
  });

  it("stays in the accessibility tree while hidden", () => {
    const banner = renderAt();
    scrollTo(300);
    expect(banner).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("button", { name: "Menú" })).toBeInTheDocument();
  });

  it("shows when focus moves into it", () => {
    const banner = renderAt();
    scrollTo(300);
    expect(banner).toHaveAttribute("data-hidden");

    act(() => {
      screen.getByRole("link", { name: "Propiedades" }).focus();
    });
    expect(banner).not.toHaveAttribute("data-hidden");

    scrollTo(600);
    expect(banner).not.toHaveAttribute("data-hidden");
  });

  it("never hides while the mobile menu is open", async () => {
    const banner = renderAt();
    await userEvent.setup().click(screen.getByRole("button", { name: "Menú" }));
    act(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });

    scrollTo(300);
    scrollTo(600);
    expect(banner).not.toHaveAttribute("data-hidden");
  });

  it("clears the document attribute when unmounted", () => {
    renderAt();
    scrollTo(300);
    expect(document.documentElement).toHaveAttribute("data-header-hidden");
    cleanup();
    expect(document.documentElement).not.toHaveAttribute("data-header-hidden");
  });

  it("removes its scroll listener when unmounted", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    renderAt();
    cleanup();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
