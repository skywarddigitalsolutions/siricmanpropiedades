export type PageItem = number | "ellipsis";

/**
 * Page numbers to show: first, last, and a window around the current page,
 * with an ellipsis where pages are skipped. Short lists are shown in full.
 */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const shown = new Set<number>([1, total]);
  // Near an end, show a longer run so the list keeps a constant length.
  const [from, to] =
    current <= 4 ? [2, 5] : current >= total - 3 ? [total - 4, total - 1] : [current - 1, current + 1];
  for (let page = from; page <= to; page += 1) shown.add(page);
  return withEllipses([...shown].sort((a, b) => a - b));
}

/** Shown numbers → items, with an ellipsis wherever pages are skipped. */
function withEllipses(pages: number[]): PageItem[] {
  const items: PageItem[] = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous > 1) items.push("ellipsis");
    items.push(page);
    previous = page;
  }
  return items;
}

/**
 * Narrow phones (44 px targets at 320 px): at most five slots. Up to 4 pages
 * are all shown; otherwise first, current and last.
 */
export function compactPageItems(current: number, total: number): PageItem[] {
  if (total <= 4) return Array.from({ length: total }, (_, index) => index + 1);
  return withEllipses([...new Set([1, current, total])].sort((a, b) => a - b));
}

export type ResponsivePageItem = {
  item: PageItem;
  key: string;
  /** Shown in the full (wide) list. */
  full: boolean;
  /** Shown in the compact (narrow) list. */
  compact: boolean;
};

/**
 * {@link pageItems} and {@link compactPageItems} merged into one ordered list,
 * so a single `<ol>` serves both widths (CSS hides the other mode's items) and
 * no page link is rendered twice. An ellipsis is identified by the page before it.
 */
export function responsivePageItems(current: number, total: number): ResponsivePageItem[] {
  const merged = new Map<string, ResponsivePageItem & { order: number }>();
  const add = (items: PageItem[], mode: "full" | "compact") => {
    let previous = 0;
    for (const item of items) {
      const isGap = item === "ellipsis";
      const key = isGap ? `gap-${previous}` : String(item);
      const entry = merged.get(key) ?? {
        item,
        key,
        full: false,
        compact: false,
        order: isGap ? previous + 0.5 : (item as number),
      };
      entry[mode] = true;
      merged.set(key, entry);
      if (!isGap) previous = item;
    }
  };
  add(pageItems(current, total), "full");
  add(compactPageItems(current, total), "compact");
  return [...merged.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ item, key, full, compact }) => ({ item, key, full, compact }));
}
