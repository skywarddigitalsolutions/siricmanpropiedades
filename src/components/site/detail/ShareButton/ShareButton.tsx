"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import styles from "./ShareButton.module.css";

const FEEDBACK_MS = 2500;

type ShareButtonProps = {
  /** Title passed to the native share sheet. */
  title: string;
  /** Look of the button itself; the caller places it (e.g. next to the price). */
  className?: string;
};

/**
 * Shares the current page: the native share sheet when the browser has one,
 * otherwise copies the URL and confirms it in a polite live region. A share
 * the visitor cancels (AbortError) is ignored.
 */
export default function ShareButton({ title, className }: ShareButtonProps) {
  const [feedback, setFeedback] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function announce(message: string) {
    clearTimeout(timer.current);
    setFeedback(message);
    timer.current = setTimeout(() => setFeedback(""), FEEDBACK_MS);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      announce("Link copiado");
    } catch {
      announce("No pudimos copiar el link");
    }
  }

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink(url);
  }

  return (
    <span className={styles.wrapper}>
      <button type="button" aria-label="Compartir" className={className} onClick={share}>
        <Share2 aria-hidden size={20} />
      </button>
      <span role="status" className={styles.feedback}>
        {feedback}
      </span>
    </span>
  );
}
