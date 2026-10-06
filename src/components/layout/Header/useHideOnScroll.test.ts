import { describe, expect, it } from "vitest";
import { decideHeaderHidden } from "./useHideOnScroll";

const base = { headerHeight: 65, threshold: 8, locked: false, hidden: false };

describe("decideHeaderHidden", () => {
  it("hides when scrolling down past the header height", () => {
    expect(decideHeaderHidden({ ...base, prevY: 100, currentY: 140 })).toEqual({
      hidden: true,
      anchorY: 140,
    });
  });

  it("does not hide while scrolling down within the header height", () => {
    expect(decideHeaderHidden({ ...base, prevY: 10, currentY: 50 })).toEqual({
      hidden: false,
      anchorY: 50,
    });
  });

  it("shows when scrolling up beyond the threshold", () => {
    expect(
      decideHeaderHidden({ ...base, hidden: true, prevY: 500, currentY: 490 }),
    ).toEqual({ hidden: false, anchorY: 490 });
  });

  it("keeps the current state and anchor for movements within the threshold", () => {
    expect(
      decideHeaderHidden({ ...base, hidden: true, prevY: 500, currentY: 495 }),
    ).toEqual({ hidden: true, anchorY: 500 });
    expect(
      decideHeaderHidden({ ...base, hidden: false, prevY: 500, currentY: 505 }),
    ).toEqual({ hidden: false, anchorY: 500 });
  });

  it("accumulates slow scrolling against the anchor until it crosses the threshold", () => {
    let state = { hidden: false, anchorY: 300 };
    for (const y of [302, 304, 306, 308]) {
      state = decideHeaderHidden({ ...base, ...state, prevY: state.anchorY, currentY: y });
    }
    expect(state).toEqual({ hidden: true, anchorY: 308 });
  });

  it("always shows near the top, even scrolling down", () => {
    expect(
      decideHeaderHidden({ ...base, hidden: true, prevY: 30, currentY: 60 }),
    ).toEqual({ hidden: false, anchorY: 60 });
    expect(
      decideHeaderHidden({ ...base, hidden: true, prevY: 64, currentY: 62 }),
    ).toEqual({ hidden: false, anchorY: 62 });
  });

  it("always shows while locked (menu open or focus inside)", () => {
    expect(
      decideHeaderHidden({ ...base, locked: true, hidden: true, prevY: 400, currentY: 900 }),
    ).toEqual({ hidden: false, anchorY: 900 });
  });
});
