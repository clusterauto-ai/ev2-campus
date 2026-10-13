"use client";

import { useState } from "react";

import { ScreenShell } from "../ui/ScreenShell";
import { OnScreenKeyboard } from "../ui/OnScreenKeyboard";
import { InlineEntry } from "../ui/InlineEntry";
import type { Profile } from "../Experience";

/**
 * Perfil del estudiante.
 *
 * Regla de diseño del tótem: teclear es caro y la gente abandona.
 * Solo el nombre se escribe; todo lo demás se resuelve tocando chips.
 * "Otra" abre un campo libre para no dejar a nadie por fuera.
 */

const UNIVERSITIES = [
  "Nacional",
  "Javeriana",
  "Los Andes",
  "Rosario",
  "Externado",
  "La Sabana",
  "Tadeo Lozano",
  "Distrital",
  "La Salle",
  "EAN",
  "Sergio Arboleda",
  "Militar",
  "Politécnico",
  "Santo Tomás",
];

const AREAS = [
  "Ingeniería",
  "Administración",
  "Economía",
  "Derecho",
  "Salud",
  "Diseño",
  "Comunicación",
  "Ciencias",
  "Educación",
];

const OTHER = "Otra";
const AGES = ["17", "18", "19", "20", "21", "22", "23", "24", "25+"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];

type Editing = "name" | "university" | "program" | null;

export function ProfileScreen({
  profile,
  onChange,
  onNext,
  onBack,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState<Editing>(
    profile.fullName.length === 0 ? "name" : null,
  );
  // Qué chips "Otra" están activos (el valor libre vive en profile).
  const [otherUni, setOtherUni] = useState(
    Boolean(profile.university) && !UNIVERSITIES.includes(profile.university),
  );
  const [otherProgram, setOtherProgram] = useState(
    Boolean(profile.program) && !AREAS.includes(profile.program),
  );

  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });

  const nameReady = profile.fullName.trim().length >= 3;
  const ready =
    nameReady &&
    profile.age &&
    profile.university.trim().length >= 2 &&
    profile.semester;

  return (
    <ScreenShell
      eyebrow="Tu perfil"
      title={
        <>
          Primero,
          <br />
          <span className="text-gradient">cuéntanos de ti.</span>
        </>
      }
      onBack={onBack}
      backLabel="Salir"
      onNext={onNext}
      nextDisabled={!ready}
    >
      <div className="flex flex-col gap-[1.6rem]">
        {/* ── Nombre ────────────────────────────────────────────── */}
        <Field label="¿Cómo te llamas?">
          <button
            type="button"
            onClick={() => setEditing("name")}
            className="field flex items-center justify-between px-[1.3rem] py-[1.15rem] text-left text-[1.15rem]"
          >
            <span className={profile.fullName ? "text-fg" : "text-fg-mute"}>
              {profile.fullName || "Toca para escribir"}
            </span>
            <span className="text-[1.1rem] text-fg-mute">✎</span>
          </button>
        </Field>

        {editing === "name" ? (
          <OnScreenKeyboard
            mode="text"
            onKey={(char) => set({ fullName: (profile.fullName + char).slice(0, 60) })}
            onBackspace={() => set({ fullName: profile.fullName.slice(0, -1) })}
            onDone={() => setEditing(null)}
            doneLabel="Listo"
            doneDisabled={!nameReady}
          />
        ) : (
          <>
            <Field label="¿Cuántos años tienes?">
              <ChipRow options={AGES} value={profile.age} onSelect={(age) => set({ age })} />
            </Field>

            <Field label="¿Dónde estudias?">
              <ChipRow
                options={[...UNIVERSITIES, OTHER]}
                value={otherUni ? OTHER : profile.university}
                onSelect={(value) => {
                  if (value === OTHER) {
                    setOtherUni(true);
                    set({ university: "" });
                    setEditing("university");
                  } else {
                    setOtherUni(false);
                    set({ university: value });
                    if (editing === "university") setEditing(null);
                  }
                }}
                wrap
              />
              {otherUni && (
                <div className="mt-[0.8rem]">
                  <InlineEntry
                    label="¿Cuál?"
                    value={profile.university}
                    placeholder="Escribe tu universidad"
                    mode="text"
                    active={editing === "university"}
                    onActivate={() => setEditing("university")}
                    onChange={(university) => set({ university })}
                    onDone={() => setEditing(null)}
                    maxLength={50}
                  />
                </div>
              )}
            </Field>

            {editing !== "university" && (
              <>
                <Field label="¿Qué estudias?">
                  <ChipRow
                    options={[...AREAS, OTHER]}
                    value={otherProgram ? OTHER : profile.program}
                    onSelect={(value) => {
                      if (value === OTHER) {
                        setOtherProgram(true);
                        set({ program: "" });
                        setEditing("program");
                      } else {
                        setOtherProgram(false);
                        set({ program: value });
                        if (editing === "program") setEditing(null);
                      }
                    }}
                    wrap
                  />
                  {otherProgram && (
                    <div className="mt-[0.8rem]">
                      <InlineEntry
                        label="¿Cuál?"
                        value={profile.program}
                        placeholder="Escribe tu carrera"
                        mode="text"
                        active={editing === "program"}
                        onActivate={() => setEditing("program")}
                        onChange={(program) => set({ program })}
                        onDone={() => setEditing(null)}
                        maxLength={50}
                      />
                    </div>
                  )}
                </Field>

                {editing !== "program" && (
                  <Field label="¿En qué semestre vas?">
                    <ChipRow
                      options={SEMESTERS}
                      value={profile.semester}
                      onSelect={(semester) => set({ semester })}
                    />
                  </Field>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ScreenShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-[0.7rem] text-[0.88rem] font-medium text-fg-dim">{label}</p>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
  wrap = false,
}: {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  wrap?: boolean;
}) {
  return (
    <div className={wrap ? "flex flex-wrap gap-[0.5rem]" : "flex gap-[0.5rem] overflow-x-auto pb-[0.3rem]"}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          data-selected={value === option}
          className="chip shrink-0 px-[1.15rem] py-[0.85rem] text-[0.92rem] font-medium"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
