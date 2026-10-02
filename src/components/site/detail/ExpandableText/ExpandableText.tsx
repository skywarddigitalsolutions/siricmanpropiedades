"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./ExpandableText.module.css";

type ExpandableTextProps = {
  paragraphs: string[];
  /** Characters above which the text is assumed to run past the clamp before measuring. */
  threshold?: number;
};

/**
 * Description paragraphs clamped to about six lines with a "Ver más" toggle.
 * Whether the toggle is needed is guessed from the length (so the server
 * render already has the right shape) and refined by measuring the rendered
 * text once it is laid out.
 */
export default function ExpandableText({ paragraphs, threshold = 320 }: ExpandableTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [fits, setFits] = useState(false);
  const mayOverflow = paragraphs.join("").length > threshold;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!mayOverflow || expanded || !element) return;
    const measure = () => {
      if (element.clientHeight === 0) return; // not laid out (tests, hidden)
      setFits(element.scrollHeight <= element.clientHeight + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mayOverflow, expanded, paragraphs]);

  const clamped = mayOverflow && !fits && !expanded;

  return (
    <div className={styles.wrapper}>
      <div
        id="detail-description-text"
        ref={ref}
        className={styles.text}
        data-clamped={clamped ? "" : undefined}
      >
        {paragraphs.map((paragraph, position) => (
          <p key={position} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
      {mayOverflow && !fits && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls="detail-description-text"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}
