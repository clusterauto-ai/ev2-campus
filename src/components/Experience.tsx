"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Ambient } from "./Ambient";
import { Stepper } from "./ui/Stepper";
import { StillThere } from "./ui/StillThere";
import { AttractScreen } from "./screens/AttractScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { TransportScreen } from "./screens/TransportScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { CaptureScreen } from "./screens/CaptureScreen";
import { ThanksScreen } from "./screens/ThanksScreen";
import { defaultSimulationInput, simulate } from "@/lib/finance";
import type { AppConfig, SimulationInput } from "@/lib/types";

export type Step =
  | "attract"
  | "profile"
  | "transport"
  | "habits"
  | "plan"
  | "result"
  | "capture"
  | "thanks";

/** Pasos que cuentan para la barra de progreso. */
const TRACKED: Step[] = [
  "profile",
  "transport",
  "habits",
  "plan",
  "result",
  "capture",
];

const STEP_LABELS = ["Tú", "Movilidad", "Hábitos", "Plan", "Resultado", "Contacto"];

/** Sin actividad este tiempo, aparece "¿Sigues ahí?". Holgado a
 *  propósito: hay que dar espacio para leer y pensar (feedback oct 2026). */
const IDLE_WARNING_MS = 180_000;
/** Si tampoco responde al aviso, se reinicia para el siguiente. */
const IDLE_GRACE_MS = 45_000;
/** Tras agradecer, la experiencia se reinicia sola. */
const THANKS_TIMEOUT_MS = 35_000;

export interface Profile {
  firstName: string;
  lastName: string;
  age: string;
  university: string;
  program: string;
  semester: string;
}

export interface Contact {
  phone: string;
  email: string;
  documentType: string;
  documentNumber: string;
  city: string;
  dealership: string;
  dataConsent: boolean;
  commercialConsent: boolean;
  marketingConsent: boolean;
}

const EMPTY_PROFILE: Profile = {
  firstName: "",
  lastName: "",
  age: "",
  university: "",
  program: "",
  semester: "",
};

const EMPTY_CONTACT: Contact = {
  phone: "",
  email: "",
  documentType: "Cédula de ciudadanía",
  documentNumber: "",
  city: "",
  dealership: "",
  dataConsent: false,
  commercialConsent: false,
  marketingConsent: false,
};

export function Experience({ config }: { config: AppConfig }) {
  const [step, setStep] = useState<Step>("attract");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [input, setInput] = useState<SimulationInput>(() =>
    defaultSimulationInput(config),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);

  const result = useMemo(() => simulate(config, input), [config, input]);

  const reset = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    setContact(EMPTY_CONTACT);
    setInput(defaultSimulationInput(config));
    setSubmitError(null);
    setSubmitting(false);
    setIdleWarning(false);
    setStep("attract");
  }, [config]);

  // Cada pantalla arranca arriba: si el usuario hizo scroll en la
  // anterior, la siguiente no puede aparecer desplazada.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step]);

  // ── Inactividad en dos fases ──────────────────────────────────
  // 1) A los 90 s sin tocar, aparece "¿Sigues ahí?" con cuenta regresiva.
  // 2) Si tampoco responde en 30 s, se reinicia (privacidad del anterior).
  // En la pantalla de gracias el reinicio es fijo y sin aviso.
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step === "attract") return;

    if (step === "thanks") {
      const t = setTimeout(reset, THANKS_TIMEOUT_MS);
      return () => clearTimeout(t);
    }

    const arm = () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      warnTimer.current = setTimeout(() => setIdleWarning(true), IDLE_WARNING_MS);
    };

    arm();
    const events = ["pointerdown", "keydown"] as const;
    events.forEach((event) => window.addEventListener(event, arm));

    return () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      events.forEach((event) => window.removeEventListener(event, arm));
    };
  }, [step, reset]);

  // ── Envío del lead ────────────────────────────────────────────
  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          ...contact,
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
          age: Number(profile.age) || null,
          eventName: process.env.NEXT_PUBLIC_EVENT_NAME,
          totemId: process.env.NEXT_PUBLIC_TOTEM_ID,
          simulation: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "No pudimos guardar tus datos.");
        setSubmitting(false);
        return;
      }

      setStep("thanks");
    } catch {
      setSubmitError("Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [profile, contact, input]);

  const trackedIndex = TRACKED.indexOf(step);

  return (
    <main className="kiosk relative flex min-h-screen flex-col overflow-hidden bg-ink-950">
      <Ambient intensity={step === "attract" ? 1.25 : 0.75} />

      {step !== "attract" && (
        <header className="relative z-10 grid grid-cols-3 items-center px-[2.2rem] pt-[2rem]">
          {/* Composición del mockup: logo | evento centrado | progreso. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kia-logo.png" alt="Kia" className="h-[1.5rem] w-auto justify-self-start" />
          <span className="justify-self-center text-[0.78rem] font-medium tracking-[0.3em] text-fg-dim">
            {config.copy.eventName.toUpperCase()}
          </span>
          <div className="flex flex-col items-end gap-[0.45rem] justify-self-end">
            {trackedIndex >= 0 && (
              <>
                <Stepper total={TRACKED.length} current={trackedIndex} labels={STEP_LABELS} />
                <span className="text-[0.62rem] tracking-[0.24em] text-fg-mute">
                  PASO {trackedIndex + 1} DE {TRACKED.length}
                </span>
              </>
            )}
          </div>
        </header>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {/* Directo al perfil: la pantalla de bienvenida se eliminó
                por el feedback de agilidad (menos texto, menos pasos). */}
            {step === "attract" && (
              <AttractScreen config={config} onStart={() => setStep("profile")} />
            )}

            {step === "profile" && (
              <ProfileScreen
                profile={profile}
                onChange={setProfile}
                onNext={() => setStep("transport")}
                onBack={reset}
              />
            )}

            {step === "transport" && (
              <TransportScreen
                config={config}
                value={input.currentTransportSpend}
                onChange={(currentTransportSpend) =>
                  setInput((prev) => ({ ...prev, currentTransportSpend }))
                }
                onNext={() => setStep("habits")}
                onBack={() => setStep("profile")}
              />
            )}

            {step === "habits" && (
              <HabitsScreen
                config={config}
                input={input}
                result={result}
                onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
                onNext={() => setStep("plan")}
                onBack={() => setStep("transport")}
              />
            )}

            {step === "plan" && (
              <PlanScreen
                config={config}
                input={input}
                result={result}
                onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
                onNext={() => setStep("result")}
                onBack={() => setStep("habits")}
              />
            )}

            {step === "result" && (
              <ResultScreen
                config={config}
                result={result}
                profile={profile}
                onNext={() => setStep("capture")}
                onBack={() => setStep("plan")}
              />
            )}

            {step === "capture" && (
              <CaptureScreen
                config={config}
                contact={contact}
                onChange={setContact}
                onSubmit={submit}
                onBack={() => setStep("result")}
                submitting={submitting}
                error={submitError}
              />
            )}

            {step === "thanks" && (
              <ThanksScreen
                config={config}
                profile={profile}
                result={result}
                onDone={reset}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {idleWarning && (
        <StillThere
          seconds={IDLE_GRACE_MS / 1000}
          onContinue={() => setIdleWarning(false)}
          onExpire={reset}
        />
      )}
    </main>
  );
}
