"use client";

import { formatCOP } from "@/lib/finance";
import type { AppConfig } from "@/lib/types";

/**
 * Pantalla de atracción: lo que se ve desde lejos cuando nadie está
 * usando el tótem. Tiene que leerse a cinco metros y provocar el
 * primer toque. Nada de formularios aquí.
 */
export function AttractScreen({
  config,
  onStart,
}: {
  config: AppConfig;
  onStart: () => void;
}) {
  const { vehicle, copy } = config;

  return (
    <button
      type="button"
      onClick={onStart}
      className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-[2.4rem] py-[3.5rem] text-left"
      aria-label={copy.ctaStart}
    >
      {/* Foto oficial de la agencia (EV con faros encendidos en el túnel).
          En horizontal va a pantalla completa como en el mockup; en
          vertical se muestra entera arriba —con los faros visibles— y se
          funde con el azul noche. Ver .attract-photo en globals.css. */}
      <span aria-hidden="true" className="attract-photo -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/attract-bg.jpg" alt="" />
      </span>
      <div className="flex w-full items-start justify-between">
        {/* Logo oficial con el lema, como en el mockup de la agencia. */}
        {/* El PNG oficial ya incluye el lema "Movement that inspires". */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kia-logo.png" alt="Kia" className="h-[2.4rem] w-auto" />
        <span className="eyebrow">{copy.eventName}</span>
      </div>

      <div className="flex w-full flex-col items-center text-center">
        <h1 className="display mt-[2rem] whitespace-pre-line text-[4.2rem] text-fg">
          {copy.heroTitle}
        </h1>

        <p className="mt-[1.6rem] max-w-[30rem] text-[1.15rem] leading-[1.5] text-fg-dim">
          {copy.heroSubtitle}
        </p>

        <div className="mt-[3rem] grid w-full max-w-[32rem] grid-cols-3 gap-[0.8rem]">
          <Spec value={`${vehicle.rangeKm}`} unit="km" label="de autonomía" />
          <Spec value={`${vehicle.horsepower}`} unit="hp" label="de potencia" />
          <Spec value="0" unit="$" label="de gasolina" />
        </div>

        <p className="mt-[2rem] text-[0.9rem] text-fg-mute">
          {vehicle.name} {vehicle.trim} · desde {formatCOP(vehicle.price)}
        </p>
      </div>

      {/* Llamado a tocar: el anillo pulsante es lo que dispara la acción. */}
      <div className="relative flex flex-col items-center gap-[1.1rem]">
        <div className="relative flex h-[5.2rem] w-[5.2rem] items-center justify-center">
          <span
            className="absolute inset-0 animate-pulse-ring rounded-full"
            style={{ border: "2px solid rgba(0,204,252,.75)" }}
          />
          <span
            className="absolute inset-0 animate-pulse-ring rounded-full"
            style={{ border: "2px solid rgba(0,204,252,.45)", animationDelay: "1.2s" }}
          />
          <span
            className="relative flex h-[3.4rem] w-[3.4rem] items-center justify-center rounded-full text-[1.5rem] text-[#ffffff]"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 34px -6px rgba(0,168,252,.95)",
            }}
          >
            ↑
          </span>
        </div>
        <p className="text-[1.05rem] font-semibold tracking-[0.14em] text-fg">
          TOCA PARA EMPEZAR
        </p>
      </div>
    </button>
  );
}

function Spec({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="panel px-[0.9rem] py-[1.2rem] text-center">
      <p className="numeric text-[2.1rem] font-light leading-none text-fg">
        {value}
        <span className="ml-[0.15rem] text-[0.95rem] text-[var(--accent-ice)]">{unit}</span>
      </p>
      <p className="mt-[0.5rem] text-[0.72rem] leading-tight text-[var(--accent-lime)]">{label}</p>
    </div>
  );
}
