"use client";

import { useEffect, useState } from "react";

export function AccessibilityTools() {
  const [open, setOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("large-text", largeText);
    root.classList.toggle("high-contrast", contrast);
    root.classList.toggle("reduce-motion", reducedMotion);
  }, [largeText, contrast, reducedMotion]);

  return (
    <div className="accessibility-menu">
      <button className="accessibility-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">Aa</span><span className="sr-only">Accessibility options</span>
      </button>
      {open && (
        <div className="accessibility-popover" role="group" aria-label="Accessibility options">
          <b>Display options</b>
          <label><input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} /> Larger text</label>
          <label><input type="checkbox" checked={contrast} onChange={(e) => setContrast(e.target.checked)} /> High contrast</label>
          <label><input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /> Reduce motion</label>
        </div>
      )}
    </div>
  );
}
