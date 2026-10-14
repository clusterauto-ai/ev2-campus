"use client";

import { useState } from "react";

import { ScreenShell } from "../ui/ScreenShell";
import { InlineEntry, formatDigitsAsCOP } from "../ui/InlineEntry";
import { formatCOP } from "@/lib/finance";
import type { AppConfig } from "@/lib/types";

/**
 * Cuánto gasta hoy en moverse.
 *
 * Este dato hace dos cosas a la vez: alimenta el cálculo (ese gasto
 * se convierte en capacidad de pago) y le muestra al estudiante que
 * ya está pagando por moverse, solo que sin quedarse con nada.
 */

// Feedback de marketing (Juana, sept 2026): sin descripciones por valor —
// en qué se va la plata depende de cada quien. Solo el monto, y "Otro
// valor" sigue abierto para quien quiera poner el suyo exacto.
const OPTIONS = [
  { value: 0, label: "Nada" },
  { value: 120_000, label: "$120 mil" },
  { value: 250_000, label: "$250 mil" },
  { value: 400_000, label: "$400 mil" },
  { value: 600_000, label: "$600 mil" },
  { value: 850_000, label: "$850 mil o más" },
];

export function TransportScreen({
  config,
  value,
  onChange,
  onNext,
  onBack,
}: {
  config: AppConfig;
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { vehicle, usage } = config;
  const kwhPerKm = vehicle.batteryKwh / vehicle.rangeKm;
  const evMonthly = usage.monthlyKm * kwhPerKm * usage.kwhPrice;
  const gasMonthly =
    (usage.monthlyKm / usage.gasolineKmPerGallon) * usage.gasolinePricePerGallon;

  const isPreset = OPTIONS.some((o) => o.value === value);
  const [other, setOther] = useState(!isPreset && value > 0);
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(other ? String(value) : "");

  return (
    <ScreenShell
      eyebrow="Tu movilidad hoy"
      title={
        <>
          ¿Cuánto gastas
          <br />
          <span className="text-gradient">moviéndote al mes?</span>
        </>
      }
      onBack={onBack}
      onNext={onNext}
    >
      <div className="grid grid-cols-2 gap-[0.7rem]">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setOther(false);
              setEditing(false);
              onChange(option.value);
            }}
            data-selected={!other && value === option.value}
            className="chip flex items-center justify-center px-[1.2rem] py-[1.35rem] text-center"
          >
            <span className="numeric text-[1.35rem] font-semibold">
              {option.label}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setOther(true);
            setEditing(true);
          }}
          data-selected={other}
          className="chip col-span-2 flex items-center justify-between px-[1.2rem] py-[1.1rem] text-left"
        >
          <span>
            <span className="text-[1.1rem] font-semibold">Otro valor</span>
            <span className="ml-[0.6rem] text-[0.78rem] text-fg-mute">
              {other && value > 0 ? formatCOP(value) + " al mes" : "Dinos tú cuánto"}
            </span>
          </span>
          <span className="text-fg-mute">✎</span>
        </button>
      </div>

      {other && (
        <div className="mt-[1rem]">
          <InlineEntry
            label="¿Cuánto gastas al mes?"
            value={raw}
            placeholder="$ 0"
            mode="numeric"
            active={editing}
            onActivate={() => setEditing(true)}
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 8);
              setRaw(digits);
              onChange(Number(digits) || 0);
            }}
            onDone={() => setEditing(false)}
            format={formatDigitsAsCOP}
            maxLength={8}
          />
        </div>
      )}

      {/* Comparación de costo de energía. Es el dato que más sorprende. */}
      {!editing && (
      <div className="panel mt-auto p-[1.5rem]">
        <p className="eyebrow mb-[1.1rem]">Mover el EV2 {usage.monthlyKm} km al mes</p>

        <div className="flex flex-col gap-[1rem]">
          <CostBar
            label="Kia EV2 · energía"
            amount={evMonthly}
            max={gasMonthly}
            color="var(--accent)"
          />
          <CostBar
            label="Carro de gasolina equivalente"
            amount={gasMonthly}
            max={gasMonthly}
            color="rgba(255,255,255,.22)"
          />
        </div>

        <p className="mt-[1.2rem] text-[0.88rem] leading-[1.45] text-fg-dim">
          Son{" "}
          <span className="font-semibold text-[var(--accent-lime)]">
            {formatCOP(gasMonthly - evMonthly)}
          </span>{" "}
          menos cada mes, solo por no pasar por la bomba.
        </p>
      </div>
      )}
    </ScreenShell>
  );
}

function CostBar({
  label,
  amount,
  max,
  color,
}: {
  label: string;
  amount: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(4, (amount / max) * 100) : 0;

  return (
    <div>
      <div className="mb-[0.45rem] flex items-baseline justify-between">
        <span className="text-[0.85rem] text-fg-dim">{label}</span>
        <span className="numeric text-[1rem] font-semibold text-fg">
          {formatCOP(amount)}
        </span>
      </div>
      <div className="h-[0.55rem] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
