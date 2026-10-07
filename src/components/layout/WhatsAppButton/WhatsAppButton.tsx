"use client";

import { usePathname } from "next/navigation";
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import styles from "./WhatsAppButton.module.css";

/** Property pages have their own WhatsApp actions and a bottom bar this would cover. */
const PROPERTY_PAGE = /^\/propiedades\/[^/]+$/;

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (PROPERTY_PAGE.test(pathname)) return null;

  const href = buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={styles.button}
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
