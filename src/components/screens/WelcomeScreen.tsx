"use client";

import { ScreenShell } from "../ui/ScreenShell";
import { Icon } from "../ui/Icon";
import type { AppConfig } from "@/lib/types";

/**
 * Encuadre de expectativas antes de pedir el primer dato. Decir de
 * entrada cuánto tarda y qué se va a llevar reduce muchísimo el
 * abandono en la pantalla siguiente.
 */
export function WelcomeScreen({
  config,
  onNext,
}: {
  config: AppConfig;
  onNext: () => void;
}) {
  const steps = [
    {
      icon: "🎓",
      title: "Cuéntanos quién eres",
      body: "Tu nombre, dónde estudias y en qué semestre vas.",
    },
    {
      icon: "💸",
      title: "Mira tus números reales",
      body: "Qué gastas hoy moviéndote y qué sacrificarías por tu primer carro.",
    },
    {
      icon: "🔑",
      title: "Recibe tu cuota",
      body: `Tu simulación del ${config.vehicle.name}, lista para revisar en casa.`,
    },
  ];

  return (
    <ScreenShell
      eyebrow="Bienvenido"
      title={
        <>
          Esto toma
          <br />
          <span className="text-gradient">90 segundos.</span>
        </>
      }
      subtitle="No es un formulario. Es tu caso, con tus cifras, para que la conversación en la casa deje de ser un “algún día”."
      onNext={onNext}
      nextLabel={config.copy.ctaStart}
    >
      <div className="flex flex-col gap-[1rem]">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="panel flex items-start gap-[1.2rem] p-[1.4rem] animate-fade-up"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.85rem] border border-line bg-[rgba(0,168,252,0.08)] text-[var(--accent-ice)]">
              <Icon name={step.icon} size="1.5rem" />
            </span>
            <div>
              <p className="text-[1.08rem] font-semibold text-fg">{step.title}</p>
              <p className="mt-[0.3rem] text-[0.92rem] leading-[1.45] text-fg-dim">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-[1.6rem]">
        <div className="panel flex items-center gap-[1rem] p-[1.2rem]">
          <Icon name="shield" size="1.4rem" className="shrink-0 text-[var(--accent-ice)]" />
          <p className="text-[0.85rem] leading-[1.45] text-fg-dim">
            Tus datos se usan solo para enviarte tu simulación y que un asesor
            Kia te contacte. Nada más.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}
