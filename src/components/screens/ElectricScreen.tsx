"use client";

import { ScreenShell } from "../ui/ScreenShell";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { Icon } from "../ui/Icon";
import { buildEquivalences, formatCOP } from "@/lib/finance";
import type { AppConfig, SimulationResult } from "@/lib/types";

/**
 * El argumento eléctrico, con pantalla propia y gráfico.
 *
 * Aquí NO se toca la cuota: se compara mes a mes lo que costaría
 * moverse y mantener un carro de gasolina del mismo precio contra el
 * EV2. Es el argumento que el estudiante le repite al papá.
 */
export function ElectricScreen({
  config,
  result,
  onNext,
  onBack,
}: {
  config: AppConfig;
  result: SimulationResult;
  onNext: () => void;
  onBack: () => void;
}) {
  const { usage } = config;

  // Costo mensual de "vivir" con cada carro, sin la cuota (es igual).
  const evTax = ((result.price * usage.vehicleTaxRate) / 100 / 12) * (1 - usage.vehicleTaxDiscount / 100);
  const gasTax = (result.price * usage.vehicleTaxRate) / 100 / 12;
  const evMaint = usage.evYearlyMaintenance / 12;
  const gasMaint = usage.gasolineYearlyMaintenance / 12;

  const ev = { energy: result.energyCost, tax: evTax, maint: evMaint };
  const gas = { energy: result.gasolineEquivalentCost, tax: gasTax, maint: gasMaint };
  const evTotal = ev.energy + ev.tax + ev.maint;
  const gasTotal = gas.energy + gas.tax + gas.maint;
  const max = Math.max(evTotal, gasTotal, 1);

  const equivalences = buildEquivalences(config, result);

  return (
    <ScreenShell
      eyebrow="Eléctrico vs. gasolina"
      title={
        <>
          Si fuera de gasolina,
          <br />
          <span className="text-gradient">pagarías esto de más.</span>
        </>
      }
      subtitle="Misma cuota, distinto carro. Así cambia lo que sale de tu bolsillo cada mes por moverte, pagar impuestos y mantenerlo."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Quiero mi simulación"
    >
      {/* Cifra protagonista */}
      <div className="panel p-[1.6rem] text-center" style={{ boxShadow: "var(--glow)" }}>
        <p className="eyebrow">El EV2 te deja en el bolsillo</p>
        <p className="numeric mt-[0.5rem] text-[3.2rem] font-light leading-none text-[var(--accent-lime)]">
          +<AnimatedNumber value={result.evSaving} format={formatCOP} />
        </p>
        <p className="mt-[0.5rem] text-[0.85rem] text-fg-dim">
          cada mes · {formatCOP(result.evSaving * result.termMonths)} en los{" "}
          {result.termMonths} meses del crédito
        </p>
      </div>

      {/* Gráfico de barras apiladas */}
      <div className="panel mt-[1rem] p-[1.5rem]">
        <p className="eyebrow mb-[1.2rem]">Costo mensual de uso · {usage.monthlyKm} km</p>

        <div className="flex flex-col gap-[1.3rem]">
          <Bar
            title="Kia EV2"
            total={evTotal}
            max={max}
            segments={[
              { label: "Carga eléctrica", value: ev.energy, color: "var(--accent)" },
              { label: "Impuesto (−60%)", value: ev.tax, color: "rgba(0,204,252,.55)" },
              { label: "Mantenimiento", value: ev.maint, color: "rgba(0,204,252,.3)" },
            ]}
            highlight
          />
          <Bar
            title="Carro de gasolina equivalente"
            total={gasTotal}
            max={max}
            segments={[
              { label: "Gasolina", value: gas.energy, color: "rgba(255,255,255,.32)" },
              { label: "Impuesto completo", value: gas.tax, color: "rgba(255,255,255,.2)" },
              { label: "Mantenimiento", value: gas.maint, color: "rgba(255,255,255,.12)" },
            ]}
          />
        </div>

        <div className="mt-[1.2rem] grid grid-cols-3 gap-[0.5rem] text-center text-[0.74rem]">
          <Delta label="Combustible" value={result.fuelSaving} />
          <Delta label="Impuesto" value={result.taxSaving} />
          <Delta label="Mantenimiento" value={result.maintenanceSaving} />
        </div>
      </div>

      {/* Equivalencias que se recuerdan */}
      <div className="mt-[1rem] flex flex-col gap-[0.55rem]">
        {equivalences.map((item) => (
          <div
            key={item.text}
            className="flex items-start gap-[0.9rem] rounded-[1.2rem] border border-line bg-white/[0.025] px-[1.1rem] py-[0.85rem]"
          >
            <Icon name={item.icon} size="1.1rem" className="mt-[0.1rem] shrink-0 text-[var(--accent-ice)]" />
            <p className="text-[0.84rem] leading-[1.45] text-fg-dim">{item.text}</p>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function Bar({
  title,
  total,
  max,
  segments,
  highlight = false,
}: {
  title: string;
  total: number;
  max: number;
  segments: { label: string; value: number; color: string }[];
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="mb-[0.5rem] flex items-baseline justify-between">
        <span className={`text-[0.9rem] ${highlight ? "font-semibold text-fg" : "text-fg-dim"}`}>{title}</span>
        <span
          className="numeric text-[1.05rem] font-semibold"
          style={{ color: highlight ? "var(--accent-lime)" : "var(--fg)" }}
        >
          {formatCOP(total)}
        </span>
      </div>
      <div className="flex h-[1.6rem] overflow-hidden rounded-full bg-white/[0.05]">
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${formatCOP(s.value)}`}
            className="h-full transition-[width] duration-1000 ease-out"
            style={{ width: `${(s.value / max) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="mt-[0.45rem] flex flex-wrap gap-x-[0.9rem] gap-y-[0.2rem] text-[0.7rem] text-fg-mute">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-[0.3rem]">
            <span className="inline-block h-[0.5rem] w-[0.5rem] rounded-full" style={{ background: s.color }} />
            {s.label} <span className="numeric text-fg-dim">{formatCOP(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Delta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[0.9rem] bg-[rgba(95,225,255,.07)] px-[0.5rem] py-[0.7rem]">
      <p className="text-fg-mute">{label}</p>
      <p className="numeric mt-[0.2rem] text-[0.95rem] font-semibold text-[var(--accent-lime)]">
        +{formatCOP(value)}
      </p>
    </div>
  );
}
