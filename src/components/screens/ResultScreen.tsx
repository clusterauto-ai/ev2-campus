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
  const firstName = profile.fullName.trim().split(" ")[0] || "Tú";
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
      nextLabel="¿Y si fuera de gasolina?"
      footerNote={config.copy.legalNotice}
    >
      <div className="flex flex-col gap-[0.9rem]">
        {/* ① Tu aporte */}
        <Stage
          number="1"
          eyebrow="Lo que tú reúnes cada mes"
          amount={result.studentCapacity}
          color="var(--accent-lime)"
          animated
        >
          <div className="mt-[0.9rem] flex flex-col gap-[0.45rem] text-[0.82rem]">
            {top3.map((h) => (
              <Line key={h.id} icon={h.id} label={`Sacrificas ${h.label.toLowerCase()}`} value={h.monthly} />
            ))}
            {result.habitBreakdown.length > 3 && (
              <Line
                icon="＋"
                label={`Otros ${result.habitBreakdown.length - 3} hábitos`}
                value={result.habitBreakdown.slice(3).reduce((s, h) => s + h.monthly, 0)}
              />
            )}
            {result.transportSaving > 0 && (
              <Line icon="🚕" label="Lo que ya gastas moviéndote" value={result.transportSaving} />
            )}
            {result.studentCapacity === 0 && (
              <p className="text-fg-mute">No elegiste nada todavía. Vuelve y mueve los controles.</p>
            )}
          </div>
        </Stage>

        {/* ② Lo que cuesta */}
        <Stage
          number="2"
          eyebrow="Lo que cuesta tener el EV2 cada mes"
          amount={result.realMonthlyCost}
          color="var(--fg)"
        >
          <div className="mt-[0.9rem] flex flex-col gap-[0.45rem] text-[0.82rem]">
            <Line icon="🏦" label={`Cuota del crédito (${result.termMonths} meses)`} value={result.loanPayment} />
            <Line icon="🛡️" label="Seguro todo riesgo" value={result.monthlyCommitment - result.loanPayment} />
            <Line icon="⚡" label={`Cargarlo (${config.usage.monthlyKm} km)`} value={result.energyCost} />
          </div>
          {config.financing.offerFirstYearInterestOnly && result.financed > 0 && (
            <p className="mt-[0.9rem] rounded-[0.9rem] bg-[rgba(0,168,252,.08)] px-[0.9rem] py-[0.7rem] text-[0.78rem] leading-[1.45] text-fg-dim">
              Con el <span className="font-semibold text-[var(--accent-ice)]">Plan Cuota Baja</span>
              {config.financing.financierName ? ` de ${config.financing.financierName}` : ""}, tu
              primer año sería de{" "}
              <span className="numeric font-semibold text-[var(--accent-ice)]">
                {formatCOP(result.firstYearPayment + result.energyCost)}
              </span>{" "}
              al mes, todo incluido.
            </p>
          )}
        </Stage>

        {/* ③ La diferencia */}
        <div
          className="panel p-[1.5rem]"
          style={{ boxShadow: "var(--glow)", borderColor: "rgba(0,204,252,.35)" }}
        >
          <div className="flex items-start gap-[0.8rem]">
            <Badge>3</Badge>
            <div className="flex-1">
              <p className="eyebrow">{surplus > 0 ? "Te sobra" : "Te falta"}</p>
              <p
                className="numeric mt-[0.35rem] text-[2.8rem] font-light leading-none"
                style={{ color: toneColor }}
              >
                <AnimatedNumber value={surplus > 0 ? surplus : result.familyGap} format={formatCOP} />
              </p>
              <p className="mt-[0.4rem] text-[0.82rem] text-fg-dim">
                {surplus > 0
                  ? "al mes, después de pagar el carro completo."
                  : "al mes. Ese es el número para hablar en casa."}
              </p>
            </div>
          </div>

          {/* Barra de cobertura */}
          <div className="mt-[1.2rem]">
            <div className="flex h-[1rem] overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${coverage}%`,
                  background: `linear-gradient(90deg, var(--accent), ${toneColor})`,
                }}
              />
            </div>
            <div className="mt-[0.5rem] flex justify-between text-[0.78rem]">
              <span className="text-fg-dim">
                Tú cubres el{" "}
                <span className="font-semibold" style={{ color: toneColor }}>
                  {coverage}%
                </span>
              </span>
              {result.familyGap > 0 && (
                <span className="text-fg-dim">
                  Falta el <span className="font-semibold text-fg">{100 - coverage}%</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

function Stage({
  number,
  eyebrow,
  amount,
  color,
  animated = false,
  children,
}: {
  number: string;
  eyebrow: string;
  amount: number;
  color: string;
  animated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-[1.4rem]">
      <div className="flex items-start gap-[0.8rem]">
        <Badge>{number}</Badge>
        <div className="flex-1">
          <p className="eyebrow">{eyebrow}</p>
          <p className="numeric mt-[0.35rem] text-[2.2rem] font-light leading-none" style={{ color }}>
            {animated ? <AnimatedNumber value={amount} format={formatCOP} /> : formatCOP(amount)}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-[0.15rem] flex h-[1.7rem] w-[1.7rem] shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-[0.82rem] font-bold text-fg">
      {children}
    </span>
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
