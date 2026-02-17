"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Easing: easeOutExpo — fast start, satisfying deceleration          */
/* ------------------------------------------------------------------ */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* ------------------------------------------------------------------ */
/*  <AnimatedCounter>                                                  */
/* ------------------------------------------------------------------ */
interface AnimatedCounterProps {
  /** The number to count up to */
  target: number;
  /** Text shown before the number (e.g. "<") */
  prefix?: string;
  /** Text shown after the number (e.g. "s", "%", "+") */
  suffix?: string;
  /** How many decimal places to show (default: 0) */
  decimals?: number;
  /** Animation duration in ms (default: 2000) */
  duration?: number;
  /** Extra className for the wrapper span */
  className?: string;
}

export default function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2000,
  className = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = eased * target;

      setDisplay(
        `${prefix}${prefix === "< " || prefix === "<" ? " " : ""}${current.toFixed(decimals)}${suffix}`.replace(
          /< {2}/,
          "< ",
        ),
      );

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // ensure we land exactly on the target value
        setDisplay(`${prefix}${target.toFixed(decimals)}${suffix}`);
      }
    }

    requestAnimationFrame(tick);
  }, [target, prefix, suffix, decimals, duration]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
          observer.unobserve(node);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
