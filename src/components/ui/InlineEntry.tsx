"use client";

import { OnScreenKeyboard } from "./OnScreenKeyboard";

/**
 * Campo de entrada libre para los "Otro → ¿cuál?".
 * Muestra el valor actual y, si está activo, el teclado en pantalla
 * debajo. Para montos formatea el número mientras se escribe.
 */
export function InlineEntry({
  label,
  value,
  placeholder,
  mode,
  active,
  onActivate,
  onChange,
  onDone,
  maxLength = 60,
  format,
}: {
  label: string;
  value: string;
  placeholder: string;
  mode: "text" | "numeric" | "email";
  active: boolean;
  onActivate: () => void;
  onChange: (value: string) => void;
  onDone: () => void;
  maxLength?: number;
  /** Cómo mostrar el valor (p. ej. como pesos). */
  format?: (raw: string) => string;
}) {
  const shown = value ? (format ? format(value) : value) : "";

  return (
    <div className="animate-fade-up">
      <p className="mb-[0.6rem] text-[0.85rem] font-medium text-fg-dim">{label}</p>
      <button
        type="button"
        onClick={onActivate}
        className="field flex w-full items-center justify-between px-[1.3rem] py-[1.1rem] text-left text-[1.1rem]"
        style={
          active
            ? { borderColor: "rgba(0,204,252,.6)", background: "rgba(0,204,252,.06)" }
            : undefined
        }
      >
        <span className={shown ? "text-fg" : "text-fg-mute"}>
          {shown || placeholder}
        </span>
        <span className="text-[1.05rem] text-fg-mute">✎</span>
      </button>

      {active && (
        <OnScreenKeyboard
          mode={mode}
          onKey={(char) => onChange((value + char).slice(0, maxLength))}
          onBackspace={() => onChange(value.slice(0, -1))}
          onDone={onDone}
          doneLabel="Listo"
          doneDisabled={value.trim().length === 0}
        />
      )}
    </div>
  );
}

/** "1250000" → "$ 1.250.000" mientras se escribe. */
export function formatDigitsAsCOP(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return "$ " + Number(digits).toLocaleString("es-CO");
}
