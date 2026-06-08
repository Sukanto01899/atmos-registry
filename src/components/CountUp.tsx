import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 650;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animate a number toward `target`, starting from 0 on mount and from the
 * previous value on subsequent changes. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, duration = DEFAULT_DURATION) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (prefersReducedMotion() || from === target) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return display;
}

export function CountUp({
  value,
  duration,
  format = (n: number) => n.toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const display = useCountUp(value, duration);
  return <>{format(display)}</>;
}
