import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import Header from "@/components/layout/Header/Header";
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

export const metadata: Metadata = {
  title: "Siricman Propiedades",
  description:
    "Venta y alquiler de propiedades en CABA, con asesoramiento personal de principio a fin.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${bodoniModa.variable} ${manrope.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
