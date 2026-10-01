"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, MapPin } from "lucide-react";
import MapEmbed from "@/components/site/MapEmbed/MapEmbed";
import TextField from "@/components/admin/forms/TextField/TextField";
import {
  findNeighborhoodByName,
  joinAddress,
  MIN_QUERY_LENGTH,
  splitAddress,
  type AddressSuggestion,
} from "@/lib/usig/address";
import styles from "./AddressField.module.css";

const DEBOUNCE_MS = 300;
const ENDPOINT = "/admin/api/direcciones";

type AddressFieldProps = {
  neighborhoods: { id: string; name: string }[];
  /** Controlled barrio (the form's select), so a validated address can suggest it. */
  neighborhoodId: string;
  onNeighborhoodChange: (id: string) => void;
  /** Address saved on the property, "Calle 123" or "Calle 123, 4° B". */
  defaultAddress?: string;
  error?: string;
};

type SearchStatus = "idle" | "loading" | "done" | "unavailable";

type BarrioNote =
  | { kind: "filled"; name: string }
  | { kind: "ask"; name: string; id: string };

/**
 * Address input with CABA validation (feature 16 T2): a combobox that asks
 * the same-origin `/admin/api/direcciones` (which calls USIG server-side),
 * a map of the chosen address and a barrio suggestion. Typing without picking
 * only warns — saving is never blocked. The back has no floor/unit field, so
 * "Piso / Depto" is appended to the submitted `address` after a comma.
 */
export default function AddressField({
  neighborhoods,
  neighborhoodId,
  onNeighborhoodChange,
  defaultAddress = "",
  error,
}: AddressFieldProps) {
  const generatedId = useId();
  const inputId = "address-search";
  const listboxId = `${generatedId}-listbox`;
  const statusId = `${generatedId}-status`;
  const optionId = (index: number) => `${generatedId}-option-${index}`;

  const initial = splitAddress(defaultAddress);
  const [text, setText] = useState(initial.base);
  const [unit, setUnit] = useState(initial.unit);
  const [touched, setTouched] = useState(false);
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [barrioNote, setBarrioNote] = useState<BarrioNote | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const neighborhoodIdRef = useRef(neighborhoodId);
  useEffect(() => {
    neighborhoodIdRef.current = neighborhoodId;
  });
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    },
    [],
  );

  const validated = picked !== null && picked.address === text;
  const trimmed = text.trim();

  function cancelPending() {
    if (timerRef.current) clearTimeout(timerRef.current);
    controllerRef.current?.abort();
  }

  async function search(query: string) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`${ENDPOINT}?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        suggestions?: AddressSuggestion[];
        unavailable?: boolean;
      };
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setStatus(data.unavailable ? "unavailable" : "done");
      setActive(-1);
      setOpen(true);
    } catch {
      if (controller.signal.aborted) return;
      setSuggestions([]);
      setStatus("unavailable");
    }
  }

  function onTextChange(value: string) {
    cancelPending();
    setText(value);
    setTouched(true);
    setBarrioNote(null);
    setPicked(null);
    setActive(-1);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setStatus("idle");
      setOpen(false);
      return;
    }
    setOpen(true);
    timerRef.current = setTimeout(() => void search(value.trim()), DEBOUNCE_MS);
  }

  async function suggestBarrio(suggestion: AddressSuggestion) {
    try {
      const response = await fetch(
        `${ENDPOINT}?lat=${suggestion.lat}&lon=${suggestion.lon}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as { barrio?: string | null };
      if (!data.barrio) return;
      const match = findNeighborhoodByName(data.barrio, neighborhoods);
      if (!match) return;
      const current = neighborhoodIdRef.current;
      if (!current) {
        onNeighborhoodChange(match.id);
        setBarrioNote({ kind: "filled", name: match.name });
      } else if (current !== match.id) {
        setBarrioNote({ kind: "ask", name: match.name, id: match.id });
      }
    } catch {
      // The barrio hint is a nicety; failing silently keeps the form usable.
    }
  }

  function choose(suggestion: AddressSuggestion) {
    cancelPending();
    setText(suggestion.address);
    setTouched(true);
    setPicked(suggestion);
    setSuggestions([]);
    setStatus("done");
    setOpen(false);
    setActive(-1);
    void suggestBarrio(suggestion);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const last = suggestions.length - 1;
    switch (event.key) {
      case "ArrowDown":
        if (last < 0) return;
        event.preventDefault();
        setOpen(true);
        setActive((current) => (current >= last ? 0 : current + 1));
        break;
      case "ArrowUp":
        if (last < 0) return;
        event.preventDefault();
        setOpen(true);
        setActive((current) => (current <= 0 ? last : current - 1));
        break;
      case "Enter":
        if (open && active >= 0 && suggestions[active]) {
          event.preventDefault();
          choose(suggestions[active]);
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
  }

  const expanded = open && suggestions.length > 0;
  const initialUnchanged = !touched && trimmed !== "";
  const mapQuery = validated
    ? `${picked.lat},${picked.lon}`
    : initialUnchanged
      ? `${trimmed}, Ciudad Autónoma de Buenos Aires, Argentina`
      : null;

  let statusMessage: React.ReactNode = null;
  if (status === "loading") {
    statusMessage = <span className={styles.muted}>Buscando…</span>;
  } else if (validated) {
    statusMessage = (
      <span className={styles.ok}>
        <Check aria-hidden size={16} />
        Dirección validada en CABA
      </span>
    );
  } else if (touched && trimmed.length >= MIN_QUERY_LENGTH && status !== "idle") {
    statusMessage =
      status === "unavailable" ? (
        <span className={styles.warn}>
          No pudimos validar la dirección. Podés guardarla igual y revisarla
          después.
        </span>
      ) : (
        <span className={styles.warn}>
          Elegí una dirección de la lista para validarla.
        </span>
      );
  }

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          Dirección
        </label>
        <div className={styles.control}>
          <MapPin aria-hidden size={18} className={styles.icon} />
          <input
            id={inputId}
            type="text"
            role="combobox"
            className={styles.input}
            value={text}
            placeholder="Ej: Boedo 123"
            maxLength={150}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            required
            aria-expanded={expanded}
            aria-controls={expanded ? listboxId : undefined}
            aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            aria-describedby={statusMessage || error ? statusId : undefined}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        {expanded && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Direcciones sugeridas"
            className={styles.listbox}
            onMouseDown={(event) => event.preventDefault()}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.address}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                data-active={index === active ? "" : undefined}
                className={styles.option}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(suggestion)}
              >
                {suggestion.address}
              </li>
            ))}
          </ul>
        )}
        <div id={statusId} className={styles.status} aria-live="polite">
          {statusMessage}
          {error && <span className={styles.error}>{error}</span>}
        </div>
        <input
          type="hidden"
          name="address"
          value={joinAddress(text, unit)}
          readOnly
        />
      </div>

      {barrioNote?.kind === "filled" && (
        <p className={styles.barrio} role="status">
          Barrio completado: {barrioNote.name}.
        </p>
      )}
      {barrioNote?.kind === "ask" && (
        <p className={styles.barrio}>
          <span>¿Es en {barrioNote.name}?</span>
          <button
            type="button"
            className={styles.apply}
            onClick={() => {
              onNeighborhoodChange(barrioNote.id);
              setBarrioNote(null);
            }}
          >
            Sí, usar {barrioNote.name}
          </button>
        </p>
      )}

      <TextField
        id="address-unit"
        name="addressUnit"
        label="Piso / Depto (opcional)"
        value={unit}
        maxLength={40}
        autoComplete="off"
        onChange={(event) => setUnit(event.target.value)}
      />

      {mapQuery && (
        <MapEmbed
          query={mapQuery}
          title="Mapa de la dirección"
          label={validated ? picked.address : undefined}
        />
      )}
    </div>
  );
}
