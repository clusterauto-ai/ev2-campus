"use client";

import { useEffect, useState } from "react";

import { Icon } from "../ui/Icon";
import { formatCOP } from "@/lib/finance";
import type { AppConfig, SimulationResult } from "@/lib/types";
import type { Profile } from "../Experience";

/**
 * Cierre. Coincide con el disparo del humo en el domo, así que la
 * pantalla también "explota": el orbe crece, la cifra clave queda en
 * grande y luego el tótem se reinicia solo para el siguiente.
 */
export function ThanksScreen({
  config,
  profile,
  result,
  onDone,
}: {
  config: AppConfig;
  profile: Profile;
  result: SimulationResult;
  onDone: () => void;
}) {
  const firstName = profile.firstName.trim().split(" ")[0] || "";
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBurst(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-[2.4rem] pb-[3rem] text-center">
      {/* Estallido de luz sincronizado con el efecto físico del domo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[1400ms] ease-out"
        style={{
          width: burst ? "140vh" : "0vh",
          height: burst ? "140vh" : "0vh",
          opacity: burst ? 0.55 : 1,
          background:
            "radial-gradient(circle, rgba(0,204,252,.55) 0%, rgba(0,168,252,.18) 35%, transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      <div className="relative animate-fade-up">
        <span className="mx-auto flex h-[6rem] w-[6rem] items-center justify-center rounded-full text-white"
          style={{ background: "var(--accent)", boxShadow: "0 0 60px -8px rgba(0,168,252,.9)" }}
        >
          <Icon name="check" size="3rem" />
        </span>

        <p className="eyebrow mt-[2rem]">
          {firstName ? `Listo, ${firstName}` : "Listo"}
        </p>

        <h1 className="display mt-[0.9rem] text-[3.6rem]">
          <span className="text-gradient">Ya tienes el número.</span>
        </h1>

        <p className="mx-auto mt-[1.4rem] max-w-[30rem] text-[1.05rem] leading-[1.5] text-fg-dim">
          {config.copy.closingMessage}
        </p>

        <div className="panel mx-auto mt-[2.6rem] w-full max-w-[30rem] p-[1.7rem]">
          <p className="eyebrow">Para contarlo en casa</p>
          <p className="numeric mt-[0.6rem] text-[2.6rem] font-light leading-none text-fg">
            {formatCOP(result.monthlyCommitment)}
          </p>
          <p className="mt-[0.4rem] text-[0.82rem] text-fg-mute">
            de cuota · tú ya pones {formatCOP(result.studentCapacity)}
            {result.familyGap > 0 && ` · faltarían ${formatCOP(result.familyGap)}`}
          </p>
        </div>

        <p className="mt-[2.4rem] text-[0.85rem] text-fg-mute">
          Revisa tu WhatsApp y tu correo en los próximos minutos.
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="btn btn-ghost relative mt-[3rem] px-[2.2rem] py-[1rem] text-[0.9rem]"
      >
        Siguiente persona →
      </button>
    </div>
  );
}
