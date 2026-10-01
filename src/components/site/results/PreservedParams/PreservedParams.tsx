import { buildSearchHref, type SearchState } from "@/lib/public/search-params";

type PreservedParamsProps = {
  state: SearchState;
  /** URL params the surrounding form sets itself. */
  omit: string[];
};

/**
 * Hidden inputs that carry the current search through a GET form that only
 * edits part of it. The page always resets to 1 because the results change.
 */
export default function PreservedParams({ state, omit }: PreservedParamsProps) {
  const params = new URLSearchParams(buildSearchHref(state).split("?")[1] ?? "");
  return (
    <>
      {[...params.entries()]
        .filter(([key]) => !omit.includes(key) && key !== "pagina")
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
    </>
  );
}
