"use client";

import { useState } from "react";

/**
 * Teclado táctil propio.
 *
 * El tótem no tiene teclado físico y el teclado del sistema operativo
 * en modo kiosco es impredecible (se abre encima del contenido, cambia
 * de tamaño, deja ver la barra de Windows). Con uno propio controlamos
 * la experiencia completa y el diseño no se rompe.
 */

type KeyboardMode = "text" | "email" | "numeric";

const ROWS_TEXT = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const ROWS_NUMERIC = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", ""],
];

const EMAIL_SHORTCUTS = ["@gmail.com", "@hotmail.com", "@outlook.com"];

export function OnScreenKeyboard({
  mode = "text",
  onKey,
  onBackspace,
  onDone,
  doneLabel = "Listo",
  doneDisabled = false,
}: {
  mode?: KeyboardMode;
  onKey: (char: string) => void;
  onBackspace: () => void;
  onDone: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
}) {
  const [shift, setShift] = useState(true);

  const press = (char: string) => {
    onKey(shift && mode !== "numeric" ? char.toUpperCase() : char);
    // Mayúscula automática solo para la primera letra, como en un móvil.
    if (shift) setShift(false);
  };

  if (mode === "numeric") {
    return (
      <div className="panel-solid mt-[1.2rem] p-[0.9rem]">
        {/* Teclas de ancho completo por celda: el teclado queda centrado
            y con área de toque generosa (feedback de estética, oct 2026). */}
        <div className="mx-auto grid max-w-[18rem] grid-cols-3 gap-[0.55rem]">
          {ROWS_NUMERIC.flat().map((digit, index) =>
            digit === "" ? (
              index === 9 ? (
                <Key key={index} onPress={onBackspace} variant="util" full>
                  ⌫
                </Key>
              ) : (
                <Key key={index} onPress={onDone} variant="accent" disabled={doneDisabled} full>
                  ✓
                </Key>
              )
            ) : (
              <Key key={index} onPress={() => onKey(digit)} full>
                {digit}
              </Key>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="panel-solid mt-[1.2rem] p-[0.75rem]">
      {mode === "email" && (
        <div className="mb-[0.6rem] flex justify-center gap-[0.45rem]">
          {EMAIL_SHORTCUTS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => onKey(domain)}
              className="chip px-[0.85rem] py-[0.4rem] text-[0.75rem] font-medium"
            >
              {domain}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-[0.4rem]">
        {ROWS_TEXT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-[0.35rem]">
            {rowIndex === 2 && (
              <Key onPress={() => setShift((s) => !s)} variant="util" wide>
                {shift ? "⇧" : "⇧"}
              </Key>
            )}
            {row.map((char) => (
              <Key key={char} onPress={() => press(char)}>
                {shift ? char.toUpperCase() : char}
              </Key>
            ))}
            {rowIndex === 2 && (
              <Key onPress={onBackspace} variant="util" wide>
                ⌫
              </Key>
            )}
          </div>
        ))}

        <div className="mt-[0.25rem] flex justify-center gap-[0.35rem]">
          {mode === "email" ? (
            <>
              <Key onPress={() => onKey("@")}>@</Key>
              <Key onPress={() => onKey(".")}>.</Key>
              <Key onPress={() => onKey("_")}>_</Key>
              <Key onPress={() => onKey("-")}>-</Key>
              {"0123456789".split("").map((d) => (
                <Key key={d} onPress={() => onKey(d)}>
                  {d}
                </Key>
              ))}
            </>
          ) : (
            <Key onPress={() => onKey(" ")} space>
              espacio
            </Key>
          )}
        </div>

        <button
          type="button"
          onClick={onDone}
          disabled={doneDisabled}
          className="btn btn-primary mt-[0.5rem] w-full py-[0.85rem] text-[0.95rem]"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}

function Key({
  children,
  onPress,
  variant = "default",
  wide = false,
  space = false,
  full = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "default" | "util" | "accent";
  wide?: boolean;
  space?: boolean;
  /** Ocupa toda la celda del grid (teclado numérico). */
  full?: boolean;
  disabled?: boolean;
}) {
  const palette =
    variant === "accent"
      ? "bg-[var(--accent)] text-[#ffffff]"
      : variant === "util"
        ? "bg-white/[0.09] text-fg-dim"
        : "bg-white/[0.05] text-fg";

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`flex items-center justify-center rounded-[0.7rem] border border-line text-[1.05rem] font-medium transition-transform duration-100 active:scale-90 disabled:opacity-30 ${palette} ${
        space
          ? "flex-1 py-[0.75rem] text-[0.85rem]"
          : full
            ? "w-full py-[0.95rem] text-[1.15rem]"
            : wide
              ? "w-[3.6rem] py-[0.75rem]"
              : "w-[2.5rem] py-[0.75rem]"
      }`}
    >
      {children}
    </button>
  );
}
