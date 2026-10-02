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

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of [...shown].sort((a, b) => a - b)) {
    if (page - previous > 1) items.push("ellipsis");
    items.push(page);
    previous = page;
  }
  return items;
}
