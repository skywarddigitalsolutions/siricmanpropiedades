"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

export type HeaderScrollInput = {
  /** Scroll position of the last decision (the anchor movement is measured from). */
  prevY: number;
  currentY: number;
  headerHeight: number;
  /** Minimum movement (px) from the anchor before the direction counts. */
  threshold: number;
  /** Menu open or focus inside the header: never hide. */
  locked: boolean;
  hidden: boolean;
};

export type HeaderScrollState = { hidden: boolean; anchorY: number };

/**
 * Pure hide/show decision. Movements smaller than the threshold keep both the
 * state and the anchor, so slow scrolling still adds up to a decision.
 */
export function decideHeaderHidden({
  prevY,
  currentY,
  headerHeight,
  threshold,
  locked,
  hidden,
}: HeaderScrollInput): HeaderScrollState {
  if (locked || currentY < headerHeight) return { hidden: false, anchorY: currentY };
  const delta = currentY - prevY;
  if (Math.abs(delta) < threshold) return { hidden, anchorY: prevY };
  return { hidden: delta > 0, anchorY: currentY };
}

/** Matches --site-header-height; used until the header has been measured. */
const FALLBACK_HEADER_HEIGHT = 65;
const SCROLL_THRESHOLD = 8;

/**
 * Whether the header should be slid out of view: hides on scroll down past its
 * height, shows on scroll up, and stays visible while `locked`. Mirrors the
 * result on <html data-header-hidden> so sticky elements can follow it in CSS.
 */
export function useHideOnScroll(headerRef: RefObject<HTMLElement | null>, locked: boolean) {
  const [hidden, setHidden] = useState(false);
  const lockedRef = useRef(locked);
  const state = useRef<HeaderScrollState>({ hidden: false, anchorY: 0 });
  const [prevLocked, setPrevLocked] = useState(locked);

  // Locking reveals the header and keeps it revealed after unlocking, until
  // the next scroll down.
  if (locked !== prevLocked) {
    setPrevLocked(locked);
    if (locked) setHidden(false);
  }

  useEffect(() => {
    lockedRef.current = locked;
    if (locked) state.current = { hidden: false, anchorY: window.scrollY };
  }, [locked]);

  useEffect(() => {
    state.current = { hidden: false, anchorY: window.scrollY };
    let frame = 0;

    const update = () => {
      frame = 0;
      const next = decideHeaderHidden({
        prevY: state.current.anchorY,
        currentY: window.scrollY,
        headerHeight: headerRef.current?.offsetHeight || FALLBACK_HEADER_HEIGHT,
        threshold: SCROLL_THRESHOLD,
        locked: lockedRef.current,
        hidden: state.current.hidden,
      });
      state.current = next;
      setHidden(next.hidden); // React bails out when unchanged.
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [headerRef]);

  const effective = hidden && !locked;

  useEffect(() => {
    const root = document.documentElement;
    if (effective) root.setAttribute("data-header-hidden", "");
    else root.removeAttribute("data-header-hidden");
    return () => root.removeAttribute("data-header-hidden");
  }, [effective]);

  return effective;
}
