"use client";

/**
 * Indicador de avance. En un tótem la gente abandona si no sabe
 * cuánto falta, así que el progreso siempre está a la vista.
 */
export function Stepper({
  total,
  current,
  labels,
}: {
  total: number;
  current: number;
  labels?: string[];
}) {
  return (
    <div className="flex items-center gap-[0.45rem]" aria-hidden="true">
      {Array.from({ length: total }).map((_, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div
            key={index}
            className="h-[0.28rem] rounded-full transition-all duration-500 ease-out"
            style={{
              width: active ? "2.6rem" : "1.1rem",
              background: done
                ? "rgba(0,204,252,.55)"
                : active
                  ? "var(--accent)"
                  : "rgba(255,255,255,.12)",
              boxShadow: active ? "0 0 18px -2px rgba(0,204,252,.9)" : "none",
            }}
            title={labels?.[index]}
          />
        );
      })}
    </div>
  );
}
