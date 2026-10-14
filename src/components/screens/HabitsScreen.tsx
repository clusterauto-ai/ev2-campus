"use client";

import { useState } from "react";

import { ScreenShell } from "../ui/ScreenShell";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { Icon } from "../ui/Icon";
import { OnScreenKeyboard } from "../ui/OnScreenKeyboard";
import { formatDigitsAsCOP } from "../ui/InlineEntry";
import { formatCOP, habitMonthlySaving, WEEKS_PER_MONTH } from "@/lib/finance";
import type {
  AppConfig,
  CustomHabit,
  Habit,
  HabitPeriod,
  SimulationInput,
  SimulationResult,
} from "@/lib/types";

/**
 * El corazón de la experiencia.
 *
 * El estudiante decide qué sacrificaría y ve la plata aparecer en tiempo
 * real. Tres reglas de claridad que salieron del feedback de marketing:
 *  - Siempre se ve "veces × costo = por semana → al mes", sin magia.
 *  - El costo unitario es una sugerencia: se toca y se cambia.
 *  - Hay un "Otro" para lo que no se nos ocurrió.
 */

const COMPACT = (n: number) => formatCOP(n).replace("$ ", "$");

type Editing =
  | { kind: "cost"; id: string }
  | { kind: "custom-label" }
  | { kind: "custom-cost" }
  | null;

export function HabitsScreen({
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
  const habits = config.habits.filter((habit) => habit.active);
  const [editing, setEditing] = useState<Editing>(null);
  const [costDraft, setCostDraft] = useState("");

  // Borrador del hábito "Otro" antes de agregarlo a la lista.
  const [draft, setDraft] = useState<{ label: string; cost: string; period: HabitPeriod }>({
    label: "",
    cost: "",
    period: "week",
  });
  const [showDraft, setShowDraft] = useState(false);

  const setCount = (id: string, next: number) =>
    onChange({ habitCounts: { ...input.habitCounts, [id]: next } });

  const effectiveCost = (h: Habit) => input.habitCostOverrides[h.id] ?? h.unitCost;

  const startCostEdit = (id: string, current: number) => {
    setCostDraft(String(current));
    setEditing({ kind: "cost", id });
  };

  const commitCost = (id: string) => {
    const value = Number(costDraft.replace(/\D/g, "")) || 0;
    onChange({ habitCostOverrides: { ...input.habitCostOverrides, [id]: value } });
    setEditing(null);
  };

  const addCustom = () => {
    const unitCost = Number(draft.cost.replace(/\D/g, "")) || 0;
    if (!draft.label.trim() || unitCost <= 0) return;
    const custom: CustomHabit = {
      id: `custom-${input.customHabits.length}`,
      label: draft.label.trim(),
      unitCost,
      period: draft.period,
      count: 1,
    };
    onChange({ customHabits: [...input.customHabits, custom] });
    setDraft({ label: "", cost: "", period: "week" });
    setShowDraft(false);
    setEditing(null);
  };

  const patchCustom = (id: string, patch: Partial<CustomHabit>) =>
    onChange({
      customHabits: input.customHabits.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });

  const removeCustom = (id: string) =>
    onChange({ customHabits: input.customHabits.filter((c) => c.id !== id) });

  const keyboardOpen = editing !== null;

  return (
    <ScreenShell
      eyebrow="Tus hábitos"
      title={
        <>
          ¿Qué sacrificarías
          <br />
          <span className="text-gradient">por tu primer carro?</span>
        </>
      }
      subtitle="No es para siempre: es para que veas que la plata ya está, solo que hoy se va en otra cosa. Los valores son sugeridos: tócalos y ponles los tuyos."
      onBack={onBack}
      onNext={keyboardOpen ? undefined : onNext}
      footerNote="Nadie va a revisar si lo cumples. La idea es que veas el número."
    >
      {/* Contador de ahorro: siempre visible mientras se juega. */}
      <div
        className="panel sticky top-0 z-20 mb-[1.2rem] flex items-center justify-between px-[1.5rem] py-[1.3rem]"
        style={{ boxShadow: "var(--glow)" }}
      >
        <div>
          <p className="eyebrow">Así liberas cada mes</p>
          <p className="numeric mt-[0.35rem] text-[2.4rem] font-light leading-none text-[var(--accent-lime)]">
            <AnimatedNumber value={result.habitsSaving} format={formatCOP} />
          </p>
        </div>
        <p className="text-right text-[0.78rem] leading-[1.4] text-fg-mute">
          eso es
          <br />
          <span className="text-fg-dim">{formatCOP(result.habitsSaving * 12)} al año</span>
        </p>
      </div>

      <div className="flex flex-col gap-[0.7rem]">
        {habits.map((habit) => {
          const count = input.habitCounts[habit.id] ?? 0;
          const unitCost = effectiveCost(habit);
          const perPeriod = unitCost * count;
          const monthly = habitMonthlySaving({ ...habit, unitCost }, count);
          const isEditingCost = editing?.kind === "cost" && editing.id === habit.id;

          return (
            <HabitRow
              key={habit.id}
              habitId={habit.id}
              icon={habit.icon}
              label={habit.label}
              hint={habit.hint}
              count={count}
              max={habit.max}
              unitCost={unitCost}
              period={habit.period}
              perPeriod={perPeriod}
              monthly={monthly}
              edited={input.habitCostOverrides[habit.id] !== undefined}
              onDec={() => setCount(habit.id, Math.max(0, count - 1))}
              onInc={() => setCount(habit.id, Math.min(habit.max, count + 1))}
              onEditCost={() => startCostEdit(habit.id, unitCost)}
            >
              {isEditingCost && (
                <CostEditor
                  draft={costDraft}
                  onChange={setCostDraft}
                  onDone={() => commitCost(habit.id)}
                  onReset={() => {
                    const { [habit.id]: _omit, ...rest } = input.habitCostOverrides;
                    void _omit;
                    onChange({ habitCostOverrides: rest });
                    setEditing(null);
                  }}
                  label={`¿Cuánto te cuesta ${habit.label.toLowerCase()} cada vez?`}
                />
              )}
            </HabitRow>
          );
        })}

        {/* Hábitos que agregó el estudiante */}
        {input.customHabits.map((c) => {
          const monthly = habitMonthlySaving(
            { id: c.id, label: c.label, hint: "", icon: "✨", unitCost: c.unitCost, period: c.period, max: 30, defaultCount: 0, active: true },
            c.count,
          );
          const isEditingCost = editing?.kind === "cost" && editing.id === c.id;
          return (
            <HabitRow
              key={c.id}
              icon="✨"
              label={c.label}
              hint="Lo agregaste tú"
              count={c.count}
              max={30}
              unitCost={c.unitCost}
              period={c.period}
              perPeriod={c.unitCost * c.count}
              monthly={monthly}
              edited
              onDec={() => (c.count <= 1 ? removeCustom(c.id) : patchCustom(c.id, { count: c.count - 1 }))}
              onInc={() => patchCustom(c.id, { count: Math.min(30, c.count + 1) })}
              onEditCost={() => startCostEdit(c.id, c.unitCost)}
            >
              {isEditingCost && (
                <CostEditor
                  draft={costDraft}
                  onChange={setCostDraft}
                  onDone={() => {
                    patchCustom(c.id, { unitCost: Number(costDraft.replace(/\D/g, "")) || c.unitCost });
                    setEditing(null);
                  }}
                  label={`¿Cuánto te cuesta ${c.label.toLowerCase()} cada vez?`}
                />
              )}
            </HabitRow>
          );
        })}

        {/* "Otro": nombre + costo + período */}
        {!showDraft ? (
          <button
            type="button"
            onClick={() => {
              setShowDraft(true);
              setEditing({ kind: "custom-label" });
            }}
            className="chip flex items-center justify-between px-[1.2rem] py-[1.15rem] text-left"
          >
            <span className="flex items-center gap-[0.9rem]">
              <Icon name="plus" size="1.5rem" className="text-[var(--accent-ice)]" />
              <span>
                <span className="block text-[1rem] font-semibold text-fg">Otro</span>
                <span className="text-[0.76rem] text-fg-mute">¿Cuál sería y cuánto te cuesta?</span>
              </span>
            </span>
            <span className="text-fg-mute">✎</span>
          </button>
        ) : (
          <div className="panel p-[1.2rem] animate-fade-up">
            <p className="eyebrow mb-[0.9rem]">Otro hábito</p>

            <div className="grid grid-cols-2 gap-[0.6rem]">
              <button
                type="button"
                onClick={() => setEditing({ kind: "custom-label" })}
                className="field px-[1rem] py-[0.9rem] text-left text-[0.95rem]"
                style={editing?.kind === "custom-label" ? { borderColor: "rgba(0,204,252,.6)" } : undefined}
              >
                <span className={draft.label ? "text-fg" : "text-fg-mute"}>
                  {draft.label || "¿Cuál? (ej. cigarrillo)"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditing({ kind: "custom-cost" })}
                className="field px-[1rem] py-[0.9rem] text-left text-[0.95rem]"
                style={editing?.kind === "custom-cost" ? { borderColor: "rgba(0,204,252,.6)" } : undefined}
              >
                <span className={draft.cost ? "numeric text-fg" : "text-fg-mute"}>
                  {draft.cost ? formatDigitsAsCOP(draft.cost) : "¿Cuánto cada vez?"}
                </span>
              </button>
            </div>

            <div className="mt-[0.7rem] flex gap-[0.5rem]">
              {(["week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, period: p }))}
                  data-selected={draft.period === p}
                  className="chip flex-1 py-[0.7rem] text-[0.85rem]"
                >
                  {p === "week" ? "Veces por semana" : "Veces al mes"}
                </button>
              ))}
            </div>

            {editing?.kind === "custom-label" && (
              <OnScreenKeyboard
                mode="text"
                onKey={(ch) => setDraft((d) => ({ ...d, label: (d.label + ch).slice(0, 40) }))}
                onBackspace={() => setDraft((d) => ({ ...d, label: d.label.slice(0, -1) }))}
                onDone={() => setEditing({ kind: "custom-cost" })}
                doneLabel="Siguiente: el costo"
                doneDisabled={draft.label.trim().length === 0}
              />
            )}
            {editing?.kind === "custom-cost" && (
              <OnScreenKeyboard
                mode="numeric"
                onKey={(ch) => setDraft((d) => ({ ...d, cost: (d.cost + ch).slice(0, 8) }))}
                onBackspace={() => setDraft((d) => ({ ...d, cost: d.cost.slice(0, -1) }))}
                onDone={addCustom}
                doneDisabled={!draft.label.trim() || !(Number(draft.cost) > 0)}
              />
            )}

            <div className="mt-[0.8rem] flex gap-[0.5rem]">
              <button
                type="button"
                onClick={() => {
                  setShowDraft(false);
                  setEditing(null);
                }}
                className="btn btn-ghost flex-1 py-[0.8rem] text-[0.85rem]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addCustom}
                disabled={!draft.label.trim() || !(Number(draft.cost) > 0)}
                className="btn btn-primary flex-1 py-[0.8rem] text-[0.85rem]"
              >
                Agregar
              </button>
            </div>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────────

function HabitRow({
  habitId,
  icon,
  label,
  hint,
  count,
  max,
  unitCost,
  period,
  perPeriod,
  monthly,
  edited,
  onDec,
  onInc,
  onEditCost,
  children,
}: {
  habitId?: string;
  icon: string;
  label: string;
  hint: string;
  count: number;
  max: number;
  unitCost: number;
  period: HabitPeriod;
  perPeriod: number;
  monthly: number;
  edited: boolean;
  onDec: () => void;
  onInc: () => void;
  onEditCost: () => void;
  children?: React.ReactNode;
}) {
  const periodShort = period === "week" ? "sem" : "mes";

  return (
    <div className="panel p-[1.15rem]">
      <div className="flex items-center gap-[1rem]">
        <span
          className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.85rem] border border-line bg-[rgba(0,168,252,0.08)] text-[var(--accent-ice)]"
        >
          <Icon name={habitId ?? icon} size="1.5rem" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[1.02rem] font-semibold leading-tight text-fg">{label}</p>
          <button
            type="button"
            onClick={onEditCost}
            className="mt-[0.2rem] inline-flex items-center gap-[0.35rem] text-[0.78rem] text-fg-mute"
          >
            <span className="numeric underline decoration-dotted underline-offset-4">
              {COMPACT(unitCost)} cada vez
            </span>
            <span aria-hidden="true">✎</span>
            {edited && <span className="text-[var(--accent)]">· tuyo</span>}
          </button>
        </div>

        {/* Claridad pedida por marketing: el número son VECES por período. */}
        <div className="flex flex-col items-center gap-[0.2rem]">
          <div className="flex items-center gap-[0.5rem]">
            <StepButton onPress={onDec} disabled={count === 0}>−</StepButton>
            <span className="numeric w-[1.6rem] text-center text-[1.2rem] font-semibold text-fg">{count}</span>
            <StepButton onPress={onInc} disabled={count >= max}>+</StepButton>
          </div>
          <span className="text-[0.62rem] leading-none text-fg-mute">
            {period === "week" ? "veces por semana" : "veces al mes"}
          </span>
        </div>
      </div>

      {/* La cuenta, explícita: veces × costo = por período → al mes */}
      <div
        className="mt-[0.8rem] flex items-center justify-between rounded-[0.9rem] px-[0.9rem] py-[0.6rem] text-[0.8rem] transition-colors duration-300"
        style={{ background: count > 0 ? "rgba(95,225,255,.07)" : "rgba(255,255,255,.03)" }}
      >
        {count > 0 ? (
          <>
            <span className="numeric text-fg-dim">
              {count} × {COMPACT(unitCost)} ={" "}
              <span className="font-semibold text-fg">{COMPACT(perPeriod)}</span>/{periodShort}
              {period === "week" && (
                <span className="text-fg-mute"> · ×{WEEKS_PER_MONTH.toFixed(1)} semanas</span>
              )}
            </span>
            <span className="numeric font-semibold text-[var(--accent-lime)]">
              {COMPACT(monthly)}/mes
            </span>
          </>
        ) : (
          <span className="text-fg-mute">{hint}</span>
        )}
      </div>

      {children}
    </div>
  );
}

function CostEditor({
  draft,
  onChange,
  onDone,
  onReset,
  label,
}: {
  draft: string;
  onChange: (v: string) => void;
  onDone: () => void;
  onReset?: () => void;
  label: string;
}) {
  return (
    <div className="mt-[0.8rem] animate-fade-up">
      <p className="text-[0.82rem] text-fg-dim">{label}</p>
      <p className="numeric mt-[0.3rem] text-[1.6rem] font-light text-fg">
        {draft ? formatDigitsAsCOP(draft) : "$ 0"}
      </p>
      <OnScreenKeyboard
        mode="numeric"
        onKey={(ch) => onChange((draft.replace(/\D/g, "") + ch).slice(0, 8))}
        onBackspace={() => onChange(draft.replace(/\D/g, "").slice(0, -1))}
        onDone={onDone}
        doneDisabled={!(Number(draft.replace(/\D/g, "")) > 0)}
      />
      {onReset && (
        <button type="button" onClick={onReset} className="mt-[0.5rem] w-full text-center text-[0.78rem] text-fg-mute underline underline-offset-4">
          Volver al valor sugerido
        </button>
      )}
    </div>
  );
}

function StepButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full border border-line-strong bg-white/[0.05] text-[1.25rem] font-medium text-fg transition-transform duration-150 active:scale-90 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
