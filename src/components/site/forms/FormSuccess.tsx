"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppIcon from "../WhatsAppIcon/WhatsAppIcon";
import styles from "./FormSuccess.module.css";

const FOLLOW_UP = buildWhatsAppLink(
  WHATSAPP_PHONE,
  "Hola Gabriel, te acabo de dejar una consulta en la web.",
);

type FormSuccessProps = { title: string; text: string };

/** Confirmation with next steps, focused so screen readers announce it. */
export default function FormSuccess({ title, text }: FormSuccessProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className={styles.success}>
      <div ref={ref} tabIndex={-1} role="status" className={styles.message}>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{text}</p>
      </div>
      <div className={styles.actions}>
        <Link href="/propiedades" className={styles.primary}>
          Seguir viendo propiedades
        </Link>
        <a href={FOLLOW_UP} target="_blank" rel="noopener noreferrer" className={styles.secondary}>
          <WhatsAppIcon size={18} />
          Escribinos por WhatsApp
        </a>
      </div>
    </div>
  );
}
