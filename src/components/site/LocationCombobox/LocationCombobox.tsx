"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import {
  findExactNeighborhood,
  matchNeighborhoods,
  normalizeSearch,
  type NeighborhoodMatch,
} from "@/lib/public/neighborhood-match";
import type { PublicNeighborhood } from "@/lib/public/types";
import styles from "./LocationCombobox.module.css";

const POPULAR = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Villa Urquiza", "Núñez"];

type LocationComboboxProps = {
  neighborhoods: PublicNeighborhood[];
  /** Slug of the barrio selected on first render. */
  defaultSlug?: string;
  /** Name of the hidden input carrying the slug. */
  name?: string;
  id?: string;
  /** Accessible label (visually hidden unless `caption` is set). */
  label?: string;
  /** Visible caption above the input (hero). */
  caption?: string;
  /** Submit the surrounding form as soon as a barrio is chosen or cleared. */
  autoSubmit?: boolean;
  /** `field`: grey box; `bar`: bordered pill; `plain`: no chrome, for a container that draws it. */
  variant?: "field" | "bar" | "plain";
};

/** Splits the original name around the matched range, for highlighting. */
function Highlighted({ name, match }: { name: string; match?: NeighborhoodMatch }) {
  if (!match) return <>{name}</>;
  return (
    <>
      {name.slice(0, match.start)}
      <mark className={styles.mark}>{name.slice(match.start, match.start + match.length)}</mark>
      {name.slice(match.start + match.length)}
    </>
  );
}

/**
 * Barrio typeahead (WAI-ARIA combobox with list autocomplete). The visible
 * input is free text; the hidden `barrio` input carries the slug, so the
 * surrounding GET form keeps working. Options are already on the client: no
 * request per keystroke.
 */
export default function LocationCombobox({
  neighborhoods,
  defaultSlug,
  name = "barrio",
  id,
  label = "Barrio",
  caption,
  autoSubmit = false,
  variant = "field",
}: LocationComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const optionId = (index: number) => `${generatedId}-option-${index}`;

  const initial = neighborhoods.find((n) => n.slug === defaultSlug);
  const [query, setQuery] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const showPopular = query.trim() === "";
  const options: NeighborhoodMatch[] = useMemo(() => {
    if (!showPopular) return matchNeighborhoods(query, neighborhoods);
    return POPULAR.flatMap((popular) => {
      const found = neighborhoods.find((n) => normalizeSearch(n.name) === normalizeSearch(popular));
      return found ? [{ neighborhood: found, start: 0, length: 0 }] : [];
    });
  }, [query, neighborhoods, showPopular]);

  // A partial name left in the box resolves to its only match when the form is
  // submitted; anything else submits without barrio (never a dead end).
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const resolve = () => {
      const hidden = hiddenRef.current;
      const input = inputRef.current;
      if (!hidden || !input || hidden.value || !input.value.trim()) return;
      const exact = findExactNeighborhood(input.value, neighborhoods);
      const matches = matchNeighborhoods(input.value, neighborhoods);
      const resolved = exact ?? (matches.length === 1 ? matches[0].neighborhood : undefined);
      if (resolved) hidden.value = resolved.slug;
    };
    form.addEventListener("submit", resolve, true);
    return () => form.removeEventListener("submit", resolve, true);
  }, [neighborhoods]);

  const submitForm = () => inputRef.current?.form?.requestSubmit();

  const choose = (neighborhood: PublicNeighborhood) => {
    setQuery(neighborhood.name);
    setSlug(neighborhood.slug);
    setOpen(false);
    setActive(-1);
    // Written straight to the DOM: the form is submitted before React re-renders.
    if (hiddenRef.current) hiddenRef.current.value = neighborhood.slug;
    if (autoSubmit) submitForm();
  };

  const clear = () => {
    const hadSelection = slug !== "";
    setQuery("");
    setSlug("");
    setActive(-1);
    setOpen(false);
    if (hiddenRef.current) hiddenRef.current.value = "";
    inputRef.current?.focus();
    if (autoSubmit && hadSelection) submitForm();
  };

  const onChange = (value: string) => {
    setQuery(value);
    setSlug(findExactNeighborhood(value, neighborhoods)?.slug ?? "");
    setOpen(true);
    setActive(value.trim() ? 0 : -1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActive((current) => (last < 0 ? -1 : current >= last ? 0 : current + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setOpen(true);
        setActive((current) => (last < 0 ? -1 : current <= 0 ? last : current - 1));
        break;
      case "Home":
        if (open && last >= 0) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open && last >= 0) {
          event.preventDefault();
          setActive(last);
        }
        break;
      case "Enter":
        if (open && active >= 0 && options[active]) {
          event.preventDefault();
          choose(options[active].neighborhood);
        }
        break;
      case "Tab":
        // Only while typing: Tab through the popular list must not pick a barrio.
        if (open && active >= 0 && options[active] && !showPopular) {
          choose(options[active].neighborhood);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
          setActive(-1);
        }
        break;
    }
  };

  const expanded = open && (options.length > 0 || !showPopular);

  return (
    <div className={`${styles.root} ${styles[variant]}`}>
      <div className={styles.control}>
        <MapPin aria-hidden size={variant === "bar" ? 16 : 20} className={styles.icon} />
        <div className={styles.text}>
          <label htmlFor={inputId} className={caption ? styles.caption : "sr-only"}>
            {caption ?? label}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={expanded}
            aria-controls={expanded && options.length > 0 ? listboxId : undefined}
            aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
            placeholder="Ingresá un barrio (ej: Palermo)"
            value={query}
            className={styles.input}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        {query && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Borrar barrio"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          >
            <X aria-hidden size={16} />
          </button>
        )}
      </div>
      <input ref={hiddenRef} type="hidden" name={name} value={slug} readOnly />

      {expanded && (
        <div className={styles.popup} onMouseDown={(event) => event.preventDefault()}>
          {options.length > 0 ? (
            <>
              {showPopular && <p className={styles.group}>Barrios populares</p>}
              <ul id={listboxId} role="listbox" aria-label={label} className={styles.listbox}>
                {options.map((match, index) => (
                  <li
                    key={match.neighborhood.slug}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active ? "" : undefined}
                    className={styles.option}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(match.neighborhood)}
                  >
                    <Highlighted
                      name={match.neighborhood.name}
                      match={showPopular ? undefined : match}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p role="status" className={styles.empty}>
              Sin coincidencias
            </p>
          )}
        </div>
      )}
    </div>
  );
}
