import type { Currency } from "./enums";
import { PROPERTY_TYPE_LABELS } from "./labels";

const TYPES_WITH_ROOMS = new Set(["apartment", "house", "ph", "office"]);

/** "Departamento 3 ambientes en Palermo": a starting point for the title, editable by the user. */
export function suggestTitle(input: {
  type: string;
  neighborhoodName: string;
  rooms: string;
}): string {
  const label = (PROPERTY_TYPE_LABELS as Record<string, string>)[input.type];
  if (!label) return "";

  const rooms = Number.parseInt(input.rooms, 10);
  const hasRooms =
    TYPES_WITH_ROOMS.has(input.type) && Number.isInteger(rooms) && rooms >= 1;

  let head = label;
  if (hasRooms) {
    head =
      input.type === "apartment" && rooms === 1
        ? "Monoambiente"
        : `${label} ${rooms} ${rooms === 1 ? "ambiente" : "ambientes"}`;
  }
  return input.neighborhoodName ? `${head} en ${input.neighborhoodName}` : head;
}

/** Sales are quoted in dollars and rents in pesos unless the user picks otherwise. */
export function currencyForOperation(operation: string): Currency | undefined {
  if (operation === "sale") return "USD";
  if (operation === "rent") return "ARS";
  return undefined;
}
