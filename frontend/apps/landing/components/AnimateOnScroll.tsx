"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Animation types                                                    */
/* ------------------------------------------------------------------ */
export type AnimationType =
  | "fade-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "rotate-in";

/* ------------------------------------------------------------------ */
/*  useScrollAnimation hook                                            */
/* ------------------------------------------------------------------ */
export function useScrollAnimation({
  threshold = 0.15,
  triggerOnce = true,
}: {
  threshold?: number;
  triggerOnce?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(node);
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, isVisible };
}

/* ------------------------------------------------------------------ */
/*  Initial style map (before animation)                               */
/* ------------------------------------------------------------------ */
const initialStyles: Record<AnimationType, React.CSSProperties> = {
  "fade-in": { opacity: 0 },
  "slide-up": { opacity: 0, transform: "translateY(40px)" },
  "slide-down": { opacity: 0, transform: "translateY(-40px)" },
  "slide-left": { opacity: 0, transform: "translateX(-60px)" },
  "slide-right": { opacity: 0, transform: "translateX(60px)" },
  "scale-in": { opacity: 0, transform: "scale(0.85)" },
  "rotate-in": { opacity: 0, transform: "rotate(-6deg) scale(0.9)" },
};

/* ------------------------------------------------------------------ */
/*  Animated style map (after entering viewport)                       */
/* ------------------------------------------------------------------ */
const animatedStyles: Record<AnimationType, React.CSSProperties> = {
  "fade-in": { opacity: 1 },
  "slide-up": { opacity: 1, transform: "translateY(0)" },
  "slide-down": { opacity: 1, transform: "translateY(0)" },
  "slide-left": { opacity: 1, transform: "translateX(0)" },
  "slide-right": { opacity: 1, transform: "translateX(0)" },
  "scale-in": { opacity: 1, transform: "scale(1)" },
  "rotate-in": { opacity: 1, transform: "rotate(0) scale(1)" },
};

/* ------------------------------------------------------------------ */
/*  <AnimateOnScroll> wrapper component                                */
/* ------------------------------------------------------------------ */
interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  /** Delay in ms before the animation starts once visible */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  /** IntersectionObserver threshold (0–1) */
  threshold?: number;
  /** Extra className on the wrapper div */
  className?: string;
}

export default function AnimateOnScroll({
  children,
  animation = "fade-in",
  delay = 0,
  duration = 700,
  threshold = 0.15,
  className = "",
}: AnimateOnScrollProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold });

  const style: React.CSSProperties = {
    ...(isVisible ? animatedStyles[animation] : initialStyles[animation]),
    transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    willChange: "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
