export type PageItem = number | "ellipsis-start" | "ellipsis-end";

const FULL_LIST_MAX = 7;

/**
 * Page numbers to render, always 7 slots wide once there are more than 7 pages
 * (so the control does not jump around): `1 2 3 4 5 … 12`, `1 … 4 5 6 … 12`,
 * `1 … 8 9 10 11 12`.
 */
export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= FULL_LIST_MAX) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }
  if (page >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [1, "ellipsis-start", page - 1, page, page + 1, "ellipsis-end", totalPages];
}
