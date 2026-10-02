import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** Opens a `Dropdown` trigger and clicks the option with the given name. */
export async function pick(user: UserEvent, trigger: HTMLElement, option: string | RegExp) {
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: option }));
}

/** Opens a `Dropdown` trigger and returns the labels of its listed options. */
export async function openLabels(user: UserEvent, trigger: HTMLElement) {
  await user.click(trigger);
  return screen.getAllByRole("option").map((option) => option.textContent);
}

/** The value a `Dropdown` submits (its hidden input). */
export function dropdownValue(trigger: HTMLElement) {
  const input = trigger.parentElement?.querySelector<HTMLInputElement>('input[type="hidden"]');
  return input?.value;
}
