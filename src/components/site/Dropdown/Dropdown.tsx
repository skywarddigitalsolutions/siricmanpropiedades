"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./Dropdown.module.css";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type DropdownProps = {
  id?: string;
  name?: string;
  options: DropdownOption[];
  defaultValue?: string;
  value?: string;
  /** Called with the new value after the hidden input already carries it. */
  onChange?: (value: string, form: HTMLFormElement | null) => void;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Classes for the wrapper (variant + chevron offset via `--dropdown-chevron-right`). */
  className?: string;
  /** Classes for the trigger button (visual style owned by the caller). */
  triggerClassName?: string;
};

const TYPEAHEAD_RESET_MS = 600;

/**
 * Accessible styled dropdown (WAI-ARIA select-only combobox): a `button`
 * trigger plus a `role="listbox"` popup that looks like the location panel.
 * A hidden input carries the value so GET/POST forms and server actions keep
 * working. Focus stays on the trigger; the active row is announced through
 * `aria-activedescendant`.
 */
export default function Dropdown({
  id,
  name,
  options,
  defaultValue,
  value: controlled,
  onChange,
  disabled,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  triggerClassName,
}: DropdownProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listboxId = `${baseId}-listbox`;

  // Placeholder rows (disabled, empty value) show in the trigger but not the list.
  const listed = options.filter((option) => !(option.disabled && option.value === ""));

  const [internal, setInternal] = useState(() => {
    const wanted = defaultValue ?? options[0]?.value ?? "";
    return options.some((option) => option.value === wanted) ? wanted : (options[0]?.value ?? "");
  });
  const value = controlled ?? internal;
  const selected = options.find((option) => option.value === value) ?? options[0];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [align, setAlign] = useState<"start" | "end">("start");
  const [missing, setMissing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", timer: 0 });
  const valueRef = useRef(value);

  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const openList = useCallback(() => {
    if (disabled) return;
    const current = listed.findIndex((option) => option.value === value && !option.disabled);
    setActiveIndex(current >= 0 ? current : listed.findIndex((option) => !option.disabled));
    setOpen(true);
  }, [disabled, listed, value]);

  const close = useCallback(() => setOpen(false), []);

  function commit(index: number) {
    const option = listed[index];
    if (!option || option.disabled) return;
    if (hiddenRef.current) hiddenRef.current.value = option.value;
    valueRef.current = option.value;
    setInternal(option.value);
    setMissing(false);
    setOpen(false);
    if (option.value !== value) onChange?.(option.value, rootRef.current?.closest("form") ?? null);
  }

  function move(from: number, step: 1 | -1) {
    let next = from;
    do {
      next += step;
    } while (listed[next]?.disabled);
    return listed[next] ? next : from;
  }

  function edge(last: boolean) {
    const indexes = listed.map((option, index) => (option.disabled ? -1 : index)).filter((i) => i >= 0);
    return (last ? indexes[indexes.length - 1] : indexes[0]) ?? -1;
  }

  function typeahead(char: string) {
    window.clearTimeout(typed.current.timer);
    typed.current.text += char.toLowerCase();
    typed.current.timer = window.setTimeout(() => {
      typed.current.text = "";
    }, TYPEAHEAD_RESET_MS);
    const text = typed.current.text;
    const single = text.split("").every((c) => c === text[0]);
    const needle = single ? text[0] : text;
    const start = single ? activeIndex + 1 : activeIndex;
    for (let step = 0; step < listed.length; step += 1) {
      const index = (Math.max(start, 0) + step) % listed.length;
      const option = listed[index];
      if (!option.disabled && option.label.toLowerCase().startsWith(needle)) {
        if (!open) setOpen(true);
        setActiveIndex(index);
        return;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const { key } = event;
    if (!open) {
      if (key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        openList();
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        openList();
        typeahead(key);
      }
      return;
    }
    if (key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => move(index, 1));
    } else if (key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => move(index, -1));
    } else if (key === "Home") {
      event.preventDefault();
      setActiveIndex(edge(false));
    } else if (key === "End") {
      event.preventDefault();
      setActiveIndex(edge(true));
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      commit(activeIndex);
    } else if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
    } else if (key === "Tab") {
      commit(activeIndex);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      typeahead(key);
    }
  }

  // Click/tap outside closes the list.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Flip above when there is no room below.
  useLayoutEffect(() => {
    if (!open || !popupRef.current || !triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const height = popupRef.current.offsetHeight;
    const below = window.innerHeight - trigger.bottom;
    setPlacement(below < height + 12 && trigger.top > below ? "top" : "bottom");
    // Keep a popup wider than its trigger inside the viewport.
    setAlign(trigger.left + popupRef.current.offsetWidth > window.innerWidth - 8 ? "end" : "start");
  }, [open]);

  // Keep the active row visible while moving with the keyboard.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  // `required` cannot be enforced natively on a hidden input: validate on submit.
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form || !required) return;
    function onSubmit(event: Event) {
      if (valueRef.current === "") {
        event.preventDefault();
        setMissing(true);
        triggerRef.current?.focus();
      }
    }
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [required]);

  useEffect(() => {
    const state = typed.current;
    return () => window.clearTimeout(state.timer);
  }, []);

  const invalid = ariaInvalid === true || ariaInvalid === "true" || missing;
  const showingPlaceholder = !!selected?.disabled && selected.value === "";

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(" ")}>
      {name && <input ref={hiddenRef} type="hidden" name={name} value={value} readOnly />}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        disabled={disabled}
        data-placeholder={showingPlaceholder ? "" : undefined}
        className={[styles.trigger, triggerClassName].filter(Boolean).join(" ")}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        onBlur={close}
      >
        <span className={styles.value}>{selected?.label ?? ""}</span>
      </button>
      <ChevronDown aria-hidden="true" focusable="false" size={18} className={styles.chevron} data-open={open ? "" : undefined} />
      {open && (
        <div
          ref={popupRef}
          className={styles.popup}
          data-placement={placement}
          data-align={align}
          onMouseDown={(event) => event.preventDefault()}
        >
          <ul id={listboxId} role="listbox" aria-label={ariaLabel} className={styles.listbox}>
            {listed.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={index === activeIndex ? "" : undefined}
                className={styles.option}
                onMouseMove={() => !option.disabled && setActiveIndex(index)}
                onClick={() => commit(index)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.value === value && <Check aria-hidden="true" size={18} className={styles.check} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
