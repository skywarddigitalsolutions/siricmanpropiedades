import { rootMetadata } from "@/lib/seo/root-metadata";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "500",
  style: "normal",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// A function (not a constant) so SITE_URL is read at runtime, not at build.
export function generateMetadata() {
  return rootMetadata();
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${bodoniModa.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
