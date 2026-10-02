import { Search, X } from "lucide-react";
import TextField from "@/components/admin/forms/TextField/TextField";
import Button, { ButtonLink } from "@/components/admin/ui/Button/Button";
import styles from "./SearchForm.module.css";

type SearchFormProps = {
  /** Page the GET form submits to. */
  action: string;
  /** Visible label and accessible name of the input, e.g. "Buscar clientes". */
  label: string;
  placeholder?: string;
  /** Current search; also shows the "Limpiar" link when set. */
  value: string;
  /** Where "Limpiar" goes (the same view without the search). */
  clearHref: string;
  /** Extra state to keep across searches (e.g. the inbox status), as hidden inputs. */
  hidden?: Record<string, string>;
};

/** Search box for panel lists: a plain GET form (no JS), so the search lives in the URL. */
export default function SearchForm({
  action,
  label,
  placeholder,
  value,
  clearHref,
  hidden = {},
}: SearchFormProps) {
  return (
    <form method="get" action={action} role="search" className={styles.form}>
      {Object.entries(hidden).map(([name, hiddenValue]) => (
        <input key={name} type="hidden" name={name} value={hiddenValue} />
      ))}
      <div className={styles.field}>
        <TextField
          id="panel-search"
          name="q"
          type="search"
          label={label}
          placeholder={placeholder}
          defaultValue={value}
          maxLength={100}
          autoComplete="off"
          icon={<Search aria-hidden size={18} />}
        />
      </div>
      <Button type="submit" className={styles.submit}>
        Buscar
      </Button>
      {value && (
        <ButtonLink
          href={clearHref}
          variant="ghost"
          icon={<X aria-hidden size={18} />}
        >
          Limpiar
        </ButtonLink>
      )}
    </form>
  );
}
