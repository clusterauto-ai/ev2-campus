"use client";

import { ScreenShell } from "../ui/ScreenShell";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { Icon } from "../ui/Icon";
import { buildNarrative, formatCOP } from "@/lib/finance";
import type { AppConfig, SimulationResult } from "@/lib/types";
import type { Profile } from "../Experience";

/**
 * El momento de la verdad, contado en tres pasos que se leen de arriba
 * abajo sin explicación:
 *
 *   ① Lo que tú reúnes   (sacrificios + lo que ya gastas moviéndote)
 *   ② Lo que cuesta      (cuota + seguro + carga)
 *   ③ Lo que falta       (o lo que sobra)
 *
 * Es honesto a propósito: el número exacto que falta es lo que convierte
 * la conversación en casa en un lead real. Prometer de más aquí destruye
 * la credibilidad en el primer contacto con el asesor.
 */
export function ResultScreen({
  config,
  result,
  profile,
  onNext,
  onBack,
}: {
  config: AppConfig;
  result: SimulationResult;
  profile: Profile;
  onNext: () => void;
  onBack: () => void;
}) {
  const narrative = buildNarrative(result);
  const firstName = profile.firstName.trim().split(" ")[0] || "Tú";
  const coverage = Math.round(result.coveragePct);
  const surplus = Math.max(0, result.studentCapacity - result.realMonthlyCost);

  const toneColor =
    narrative.tone === "excelente"
      ? "var(--accent-lime)"
      : narrative.tone === "bueno"
        ? "var(--accent)"
        : "var(--accent-ice)";

  const top3 = result.habitBreakdown.slice(0, 3);

  return (
    <ScreenShell
      eyebrow={`Tu resultado · ${firstName}`}
      title={<span style={{ color: toneColor }}>{narrative.headline}</span>}
      subtitle={narrative.body}
      onBack={onBack}
      onNext={onNext}
      nextLabel="Quiero mi simulación"
      footerNote={config.copy.legalNotice}
    >
      {/* Comparativo lado a lado (feedback oct 2026): lo que reúnes
          frente a lo que cuesta, y debajo la diferencia. Una sola
          lectura horizontal en vez de tres bloques apilados. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-[0.7rem]">
        <div className="panel flex flex-col p-[1.3rem]">
          <p className="eyebrow">Reúnes al mes</p>
          <p className="numeric mt-[0.45rem] text-[1.9rem] font-light leading-none text-[var(--accent-lime)]">
            <AnimatedNumber value={result.studentCapacity} format={formatCOP} />
          </p>
          <div className="mt-[0.9rem] flex flex-col gap-[0.4rem] text-[0.78rem]">
            {top3.map((h) => (
              <Line key={h.id} icon={h.id} label={h.label} value={h.monthly} />
            ))}
            {result.habitBreakdown.length > 3 && (
              <Line
                icon="＋"
                label={`Otros ${result.habitBreakdown.length - 3} hábitos`}
                value={result.habitBreakdown.slice(3).reduce((s, h) => s + h.monthly, 0)}
              />
            )}
            {result.transportSaving > 0 && (
              <Line icon="🚕" label="Transporte de hoy" value={result.transportSaving} />
            )}
            {result.studentCapacity === 0 && (
              <p className="text-fg-mute">Vuelve y mueve los controles.</p>
            )}
          </div>
        </div>

        {/* El "contra" visual entre las dos columnas. */}
        <div className="flex items-center text-[1.3rem] font-light text-fg-mute">vs</div>

        <div className="panel flex flex-col p-[1.3rem]">
          <p className="eyebrow">Cuesta al mes</p>
          <p className="numeric mt-[0.45rem] text-[1.9rem] font-light leading-none text-fg">
            <AnimatedNumber value={result.realMonthlyCost} format={formatCOP} />
          </p>
          <div className="mt-[0.9rem] flex flex-col gap-[0.4rem] text-[0.78rem]">
            <Line icon="🏦" label={`Cuota (${result.termMonths} m)`} value={result.loanPayment} />
            <Line icon="🛡️" label="Seguro" value={result.monthlyCommitment - result.loanPayment} />
            <Line icon="⚡" label="Carga" value={result.energyCost} />
          </div>
        </div>
      </div>

      {/* La diferencia, en grande y debajo de las dos columnas. */}
      <div
        className="panel mt-[0.9rem] p-[1.5rem]"
        style={{ boxShadow: "var(--glow)", borderColor: "rgba(0,204,252,.35)" }}
      >
        <div className="flex items-end justify-between gap-[1rem]">
          <div>
            <p className="eyebrow">{surplus > 0 ? "Te sobra" : "Te falta"}</p>
            <p
              className="numeric mt-[0.35rem] text-[2.8rem] font-light leading-none"
              style={{ color: toneColor }}
            >
              <AnimatedNumber value={surplus > 0 ? surplus : result.familyGap} format={formatCOP} />
            </p>
          </div>
          <p className="numeric pb-[0.3rem] text-right text-[1.1rem] font-semibold" style={{ color: toneColor }}>
            {coverage}%<span className="block text-[0.68rem] font-normal text-fg-mute">lo cubres tú</span>
          </p>
        </div>

        <div className="mt-[1rem]">
          <div className="flex h-[1rem] overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${coverage}%`,
                background: `linear-gradient(90deg, var(--accent), ${toneColor})`,
              }}
            />
          </div>
        </div>

        {result.graceMonths > 0 && result.financed > 0 && (
          <p className="mt-[1rem] rounded-[0.9rem] bg-[rgba(0,168,252,.08)] px-[0.9rem] py-[0.7rem] text-[0.78rem] leading-[1.45] text-fg-dim">
            Y arrancas suave: con el período de gracia
            {config.financing.financierName ? ` de ${config.financing.financierName}` : ""}, tus
            primeros {result.graceMonths} meses pagas{" "}
            <span className="numeric font-semibold text-[var(--accent-ice)]">
              {formatCOP(result.firstYearPayment + result.energyCost)}
            </span>{" "}
            al mes (seguros + carga). La cuota llega en 2027.
          </p>
        )}
      </div>
    </ScreenShell>
  );
}

function Line({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-[0.8rem]">
      <span className="flex items-center gap-[0.5rem] text-fg-dim">
        <Icon name={icon} size="1rem" className="shrink-0 text-[var(--accent-ice)]" />
        {label}
      </span>
      <span className="numeric font-semibold text-fg">{formatCOP(value)}</span>
    </div>
  );
}
