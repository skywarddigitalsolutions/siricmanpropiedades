import type { ReactNode } from "react";
import styles from "./LegalPage.module.css";

export type LegalSection = {
  heading: string;
  /** Paragraphs and lists, in order. */
  content: ReactNode[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

/** Shared reading layout for the legal pages (terms, privacy). */
export default function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  return (
    <main className={styles.main}>
      <article className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Última actualización: {updated}</p>
          <p className={styles.intro}>{intro}</p>
        </header>
        {sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.heading}>{section.heading}</h2>
            {section.content.map((block, index) => (
              <div key={index} className={styles.block}>
                {block}
              </div>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
