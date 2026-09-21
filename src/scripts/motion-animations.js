import { animate, inView, stagger } from "motion";

// Helper to run animations only if user has not requested reduced motion
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// We'll add the animation logic here in the next phases.
export function initMotion() {
  if (prefersReducedMotion()) {
    return;
  }
  // Phase 2 and 3 code will go here.
}
