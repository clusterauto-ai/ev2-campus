"use client";

import { useEffect, useState } from "react";

/**
 * Aviso de inactividad. En vez de expulsar a la persona a mitad de
 * recorrido, le preguntamos. Solo si nadie responde se reinicia, para
 * que el siguiente no vea los datos del anterior.
 */
export function StillThere({
  seconds,
  onContinue,
  onExpire,
}: {
  seconds: number;
  onContinue: () => void;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onExpire();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onExpire]);

  const pct = (left / seconds) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-[2rem] backdrop-blur-md"
      onPointerDown={onContinue}
      role="dialog"
      aria-modal="true"
    >
      <div className="panel w-full max-w-[30rem] p-[2.2rem] text-center animate-fade-up">
        <div className="relative mx-auto mb-[1.6rem] h-[6rem] w-[6rem]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="numeric absolute inset-0 flex items-center justify-center text-[1.9rem] font-light">
            {left}
          </span>
        </div>

        <h2 className="display text-[2.4rem]">¿Sigues ahí?</h2>
        <p className="mt-[0.8rem] text-[0.95rem] leading-[1.5] text-fg-dim">
          Toca la pantalla para seguir donde ibas. Si no, reiniciamos para la
          siguiente persona.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="btn btn-primary mt-[1.8rem] w-full py-[1.1rem] text-[1rem]"
        >
          Sí, sigo aquí
        </button>
        <button
          type="button"
          onClick={onExpire}
          className="btn btn-ghost mt-[0.7rem] w-full py-[0.9rem] text-[0.9rem]"
        >
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
}
