"use client";

import { useState } from "react";

import { ScreenShell } from "../ui/ScreenShell";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { InlineEntry, formatDigitsAsCOP } from "../ui/InlineEntry";
import { formatCOP, formatCompactCOP } from "@/lib/finance";
import type { AppConfig, SimulationInput, SimulationResult } from "@/lib/types";

/**
 * Armado del plan de pago.
 *
 * No todo el mundo llega solo con crédito: hay ahorros, plata de la
 * familia, o un carro usado para entregar. Aquí se combinan las tres
 * fuentes y la cuota se recalcula sobre lo que queda por financiar.
 */

const TRADE_IN_OPTIONS = [
  { value: 0, label: "No tengo" },
  { value: 20_000_000, label: "$20 M" },
  { value: 30_000_000, label: "$30 M" },
  { value: 45_000_000, label: "$45 M" },
];

type Editing = "downPayment" | "tradeIn" | null;

export function PlanScreen({
  config,
  input,
  result,
  onChange,
  onNext,
  onBack,
}: {
  config: AppConfig;
  input: SimulationInput;
  result: SimulationResult;
  onChange: (patch: Partial<SimulationInput>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { financing, vehicle } = config;
  const price = vehicle.price;

  const downOptions = financing.downPaymentOptions.map((pct) => ({
    pct,
    value: Math.round((price * pct) / 100),
  }));
  const downIsPreset = downOptions.some((o) => o.value === input.downPayment);
  const tradeIsPreset = TRADE_IN_OPTIONS.some((o) => o.value === input.tradeInValue);

  const [otherDown, setOtherDown] = useState(!downIsPreset);
  const [otherTrade, setOtherTrade] = useState(!tradeIsPreset);
  const [editing, setEditing] = useState<Editing>(null);
  const [downRaw, setDownRaw] = useState(otherDown ? String(input.downPayment) : "");
  const [tradeRaw, setTradeRaw] = useState(otherTrade ? String(input.tradeInValue) : "");

  const upfront = result.downPayment + result.tradeInValue;
  const upfrontPct = price > 0 ? Math.round((upfront / price) * 100) : 0;
  const financedPct = 100 - upfrontPct;

  return (
    <ScreenShell
      eyebrow="Tu plan de pago"
      title={
        <>
          ¿Cómo lo
          <br />
          <span className="text-gradient">pagarías?</span>
        </>
      }
      subtitle="Combina lo que tengas: ahorros, apoyo de la familia, un carro usado. Lo que falte se financia y la cuota se ajusta sola."
      onBack={onBack}
      onNext={editing ? undefined : onNext}
      nextLabel="Ver mi resultado"
      footerNote={config.copy.legalNotice}
    >
      {/* Cuota en vivo */}
      <div className="panel mb-[1.4rem] p-[1.6rem] text-center" style={{ boxShadow: "var(--glow)" }}>
        <p className="eyebrow">Tu cuota mensual sería</p>
        <p className="numeric mt-[0.5rem] text-[3.4rem] font-light leading-none text-fg">
          <AnimatedNumber value={result.monthlyCommitment} format={formatCOP} />
        </p>
        <p className="mt-[0.7rem] text-[0.8rem] leading-[1.45] text-fg-mute">
          Financiando {formatCOP(result.financed)} a {input.termMonths} meses · incluye seguro
          todo riesgo estimado ·{" "}
          {financing.rateNote || `tasa ${financing.annualRate}% E.A.`}
        </p>

        {/* Plan Cuota Baja de la financiera: primer año solo intereses. */}
        {financing.offerFirstYearInterestOnly && result.financed > 0 && (
          <p className="mx-auto mt-[0.9rem] w-fit rounded-full border border-[rgba(0,204,252,.35)] bg-[rgba(0,168,252,.1)] px-[1.1rem] py-[0.5rem] text-[0.82rem] text-fg-dim">
            Plan Cuota Baja{financing.financierName ? ` ${financing.financierName}` : ""}: tu
            primer año pagarías{" "}
            <span className="numeric font-semibold text-[var(--accent-ice)]">
              {formatCOP(result.firstYearPayment)}
            </span>
            /mes
          </p>
        )}

        {/* Curva "entrada vs crédito" del guideline (pág. 12). */}
        <PaymentCurve
          upfrontPct={upfrontPct}
          financedPct={financedPct}
          upfront={upfront}
          financed={result.financed}
        />
      </div>

      <div className="flex flex-col gap-[1.5rem]">
        {/* ── 1. Cuota inicial ─────────────────────────────────── */}
        <Block
          number="1"
          title="¿Cuánto pondrían de inicial?"
          hint={`${financing.financierName || "La financiera"} financia hasta el 100% — sin inicial obligatoria, según perfil`}
          value={formatCOP(result.downPayment)}
        >
          <div className="grid grid-cols-5 gap-[0.45rem]">
            {downOptions.map((o) => (
              <button
                key={o.pct}
                type="button"
                onClick={() => {
                  setOtherDown(false);
                  setEditing(null);
                  onChange({ downPayment: o.value });
                }}
                data-selected={!otherDown && input.downPayment === o.value}
                className="chip py-[0.85rem] text-center"
              >
                <span className="numeric block text-[1.05rem] font-semibold">
                  {o.pct === 0 ? "$0" : `${o.pct}%`}
                </span>
                {/* El equivalente en pesos, para no hacer la cuenta mental. */}
                <span className="numeric block text-[0.64rem] leading-tight text-fg-mute">
                  {o.pct === 0 ? "sin inicial" : formatCompactCOP(o.value)}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOtherDown(true);
                setEditing("downPayment");
              }}
              data-selected={otherDown}
              className="chip py-[0.85rem] text-center text-[0.85rem] font-semibold"
            >
              Otro
            </button>
          </div>
          {otherDown && (
            <div className="mt-[0.8rem]">
              <InlineEntry
                label="¿Cuánto exactamente?"
                value={downRaw}
                placeholder="$ 0"
                mode="numeric"
                active={editing === "downPayment"}
                onActivate={() => setEditing("downPayment")}
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 9);
                  setDownRaw(digits);
                  onChange({ downPayment: Number(digits) || 0 });
                }}
                onDone={() => setEditing(null)}
                format={formatDigitsAsCOP}
                maxLength={9}
              />
            </div>
          )}
        </Block>

        {/* ── 2. Carro de retoma ───────────────────────────────── */}
        {editing !== "downPayment" && (
          <Block
            number="2"
            title="¿Tienen un carro para entregar?"
            hint="Kia lo recibe como parte de pago"
            value={result.tradeInValue > 0 ? formatCOP(result.tradeInValue) : "—"}
          >
            <div className="grid grid-cols-5 gap-[0.45rem]">
              {TRADE_IN_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setOtherTrade(false);
                    setEditing(null);
                    onChange({ tradeInValue: o.value });
                  }}
                  data-selected={!otherTrade && input.tradeInValue === o.value}
                  className="chip py-[0.85rem] text-center text-[0.85rem] font-semibold"
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOtherTrade(true);
                  setEditing("tradeIn");
                }}
                data-selected={otherTrade}
                className="chip py-[0.85rem] text-center text-[0.85rem] font-semibold"
              >
                Otro
              </button>
            </div>
            {otherTrade && (
              <div className="mt-[0.8rem]">
                <InlineEntry
                  label="¿En cuánto lo recibirían, más o menos?"
                  value={tradeRaw}
                  placeholder="$ 0"
                  mode="numeric"
                  active={editing === "tradeIn"}
                  onActivate={() => setEditing("tradeIn")}
                  onChange={(v) => {
                    const digits = v.replace(/\D/g, "").slice(0, 9);
                    setTradeRaw(digits);
                    onChange({ tradeInValue: Number(digits) || 0 });
                  }}
                  onDone={() => setEditing(null)}
                  format={formatDigitsAsCOP}
                  maxLength={9}
                />
              </div>
            )}
          </Block>
        )}

        {/* ── 3. Plazo del crédito ─────────────────────────────── */}
        {!editing && (
          <Block
            number="3"
            title="¿En cuánto tiempo pagarían el resto?"
            hint={`${formatCOP(result.financed)} a crédito`}
            value={`${(input.termMonths / 12).toFixed(0)} años`}
          >
            <div className="grid grid-cols-4 gap-[0.5rem]">
              {financing.terms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onChange({ termMonths: term })}
                  data-selected={input.termMonths === term}
                  className="chip py-[0.95rem] text-center"
                >
                  <span className="numeric block text-[1.15rem] font-semibold">{term}</span>
                  <span className="text-[0.68rem] text-fg-mute">meses</span>
                </button>
              ))}
            </div>
          </Block>
        )}

        {/* ── 4. Con quién haría el crédito ────────────────────── */}
        {/* Dato clave de la propuesta Finandina: suma de ingresos y
            codeudor familiar destraban el crédito joven. Va al asesor. */}
        {!editing && (
          <Block
            number="4"
            title="¿Con quién harías el crédito?"
            hint="Finandina acepta sumar ingresos con tus papás o un codeudor familiar"
            value={input.creditSupport || "—"}
          >
            <div className="grid grid-cols-3 gap-[0.45rem]">
              {["Solo yo", "Con mis papás", "Suma de ingresos familiar"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange({ creditSupport: option })}
                  data-selected={input.creditSupport === option}
                  className="chip px-[0.6rem] py-[0.9rem] text-center text-[0.84rem] font-semibold leading-tight"
                >
                  {option}
                </button>
              ))}
            </div>
          </Block>
        )}
      </div>

      {/* Planes especiales de la financiera (propuesta Finandina pág. 4). */}
      {!editing && financing.financierName && (
        <div className="panel mt-[1.4rem] p-[1.4rem]">
          <div className="mb-[0.9rem] flex items-center justify-between gap-[0.8rem]">
            <div className="flex items-center gap-[0.7rem]">
              {/* Logo oficial del banco aliado, sobre placa blanca para
                  respetar su marca (es rojo) sin romper el tema oscuro. */}
              <span className="flex items-center rounded-[0.6rem] bg-white px-[0.7rem] py-[0.35rem]">
                {/* Versión horizontal oficial del brandbook Finandina. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/finandina-h.webp" alt="Banco Finandina - Banca libre" className="h-[1.5rem] w-auto" />
              </span>
              <p className="eyebrow">Planes {financing.financierName}</p>
            </div>
            <p className="text-[0.7rem] text-fg-mute">según perfil y política vigente</p>
          </div>
          <div className="grid grid-cols-2 gap-[0.55rem] text-[0.78rem] leading-[1.4]">
            {financing.offerFirstYearInterestOnly && (
              <PlanCard
                title="Cuota Baja"
                body={`Primer año pagas solo intereses: ${formatCOP(result.firstYearPayment)}/mes`}
              />
            )}
            <PlanCard title="Período de gracia" body="Hasta 12 meses pagando solo cargos fijos" />
            <PlanCard title="Cuota extra 14/12" body="Cuota extra opcional en junio y diciembre" />
            <PlanCard title="Sin historial crediticio" body="Financiación hasta el 70%, o más con codeudor familiar" />
          </div>

          {/* Sello regulatorio que debe acompañar la marca del banco.
              El PNG es negro: se invierte para legibilidad en tema oscuro. */}
          <div className="mt-[1rem] flex justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vigilado.png"
              alt="Vigilado Superintendencia Financiera de Colombia"
              className="h-[0.8rem] w-auto opacity-60"
              style={{ filter: "invert(1)" }}
            />
          </div>
        </div>
      )}

      {/* Desglose para que el número no parezca sacado del aire. */}
      {!editing && (
        <div className="panel mt-[1.4rem] p-[1.4rem]">
          <p className="eyebrow mb-[1rem]">Cómo se compone</p>
          <div className="flex flex-col gap-[0.6rem] text-[0.86rem]">
            <Row label={`${vehicle.name} ${vehicle.trim}`} value={formatCOP(result.price)} />
            <Row label="Cuota inicial" value={`− ${formatCOP(result.downPayment)}`} />
            {result.tradeInValue > 0 && (
              <Row label="Carro de retoma" value={`− ${formatCOP(result.tradeInValue)}`} />
            )}
            <Row label="Monto a financiar" value={formatCOP(result.financed)} strong />
            <div className="my-[0.2rem] h-px bg-line" />
            <Row label={`Cuota del crédito (${input.termMonths} meses)`} value={formatCOP(result.loanPayment)} />
            <Row label="Seguro todo riesgo" value={formatCOP(financing.monthlyInsurance)} />
            <Row label="Total mensual" value={formatCOP(result.monthlyCommitment)} strong accent />
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function PlanCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[0.9rem] border border-line bg-white/[0.03] px-[0.9rem] py-[0.75rem]">
      <p className="font-semibold text-[var(--accent-ice)]">{title}</p>
      <p className="mt-[0.2rem] text-fg-dim">{body}</p>
    </div>
  );
}

/**
 * Curva de reparto del pago, tomada del mockup de la agencia: dos
 * lomas —la entrada y el monto a crédito— cuya altura sigue el peso
 * de cada parte, con un punto luminoso sobre cada pico.
 */
function PaymentCurve({
  upfrontPct,
  financedPct,
  upfront,
  financed,
}: {
  upfrontPct: number;
  financedPct: number;
  upfront: number;
  financed: number;
}) {
  // Altura de cada loma: mínimo visible aunque el % sea pequeño.
  const h1 = 6 + 22 * (upfrontPct / 100);
  const h2 = 6 + 22 * (financedPct / 100);
  const base = 36;
  const p1 = { x: 26, y: base - h1 };
  const p2 = { x: 72, y: base - h2 };

  const line =
    `M 0 ${base} C 12 ${base}, 16 ${p1.y}, ${p1.x} ${p1.y} ` +
    `C 36 ${p1.y}, 40 ${base}, 49 ${base} ` +
    `C 58 ${base}, 60 ${p2.y}, ${p2.x} ${p2.y} ` +
    `C 84 ${p2.y}, 90 ${base}, 100 ${base}`;

  return (
    <div className="mt-[1.1rem]">
      <div className="relative">
        {/* Etiquetas sobre cada pico. */}
        <div
          className="absolute -top-[0.2rem] text-center"
          style={{ left: `${p1.x}%`, transform: "translateX(-50%)" }}
        >
          <p className="numeric text-[0.9rem] font-bold text-fg">{upfrontPct}%</p>
        </div>
        <div
          className="absolute -top-[0.2rem] text-center"
          style={{ left: `${p2.x}%`, transform: "translateX(-50%)" }}
        >
          <p className="numeric text-[0.9rem] font-bold text-fg">{financedPct}%</p>
        </div>

        <svg viewBox="0 0 100 38" className="mt-[1.4rem] w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,120,96,0.5)" />
              <stop offset="34%" stopColor="rgba(0,82,69,0.35)" />
              <stop offset="52%" stopColor="rgba(0,88,140,0.3)" />
              <stop offset="100%" stopColor="rgba(0,168,252,0.4)" />
            </linearGradient>
            <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2fd9a8" />
              <stop offset="60%" stopColor="#00a8fc" />
              <stop offset="100%" stopColor="#00ccfc" />
            </linearGradient>
          </defs>

          <path d={`${line} L 100 38 L 0 38 Z`} fill="url(#curveFill)" />
          <path d={line} fill="none" stroke="url(#curveStroke)" strokeWidth="0.7" />

          {/* Líneas punteadas de pico a base. */}
          <line x1={p1.x} y1={p1.y} x2={p1.x} y2={base} stroke="rgba(255,255,255,.4)" strokeWidth="0.35" strokeDasharray="1.1 1.1" />
          <line x1={p2.x} y1={p2.y} x2={p2.x} y2={base} stroke="rgba(255,255,255,.4)" strokeWidth="0.35" strokeDasharray="1.1 1.1" />

          {/* Puntos luminosos. */}
          <circle cx={p1.x} cy={p1.y} r="1.7" fill="#ffffff" />
          <circle cx={p1.x} cy={p1.y} r="3" fill="none" stroke="rgba(47,217,168,.6)" strokeWidth="0.45" />
          <circle cx={p2.x} cy={p2.y} r="1.7" fill="#ffffff" />
          <circle cx={p2.x} cy={p2.y} r="3" fill="none" stroke="rgba(0,204,252,.65)" strokeWidth="0.45" />
        </svg>
      </div>

      <div className="mt-[0.45rem] flex justify-between text-[0.72rem] text-fg-mute">
        <span>0%</span>
        <span className="text-fg-dim">
          Tu entrada · <span className="numeric text-[#2fd9a8]">{formatCOP(upfront)}</span>
        </span>
        <span className="text-fg-dim">
          A crédito · <span className="numeric text-[var(--accent-ice)]">{formatCOP(financed)}</span>
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}

function Block({
  number,
  title,
  hint,
  value,
  children,
}: {
  number: string;
  title: string;
  hint: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-[0.75rem] flex items-start justify-between gap-[1rem]">
        <div className="flex items-start gap-[0.7rem]">
          <span className="mt-[0.1rem] flex h-[1.5rem] w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[0.75rem] font-bold text-fg-dim">
            {number}
          </span>
          <div>
            <p className="text-[0.95rem] font-medium text-fg">{title}</p>
            <p className="text-[0.74rem] text-fg-mute">{hint}</p>
          </div>
        </div>
        <p className="numeric shrink-0 text-[0.85rem] font-semibold text-fg-dim">{value}</p>
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-[1rem]">
      <span className={strong ? "text-fg" : "text-fg-dim"}>{label}</span>
      <span className="numeric font-semibold" style={{ color: accent ? "var(--accent)" : "var(--fg)" }}>
        {value}
      </span>
    </div>
  );
}
