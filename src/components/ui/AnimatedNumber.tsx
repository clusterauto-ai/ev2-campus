"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cifra que se anima hasta su valor. En una activación esto importa:
 * ver el número subir hace que la persona se quede mirando la pantalla
 * en el momento exacto en que le estamos dando el argumento de venta.
 */
export function AnimatedNumber({
  value,
  format,
  durationMs = 850,
  className,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const delta = value - from;

    if (Math.abs(delta) < 1) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutExpo: arranca rápido y frena suave, se siente premium.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + delta * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
