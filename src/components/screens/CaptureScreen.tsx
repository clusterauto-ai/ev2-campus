"use client";

import { useState } from "react";

import { ScreenShell } from "../ui/ScreenShell";
import { OnScreenKeyboard } from "../ui/OnScreenKeyboard";
import { CITIES, DEALERSHIPS, DOCUMENT_TYPES, isValidDocument } from "@/lib/dealerships";
import type { AppConfig } from "@/lib/types";
import type { Contact } from "../Experience";

/**
 * Captura del contacto.
 *
 * Va de último a propósito: para cuando llega aquí, el estudiante ya
 * vio su número y quiere llevárselo. Pedir el celular al principio
 * habría botado la mitad de los registros.
 *
 * La autorización de tratamiento de datos (Ley 1581 de 2012) es
 * obligatoria y no viene premarcada.
 */

const PHONE_OK = /^3\d{9}$/;
const EMAIL_OK = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function CaptureScreen({
  config,
  contact,
  onChange,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  config: AppConfig;
  contact: Contact;
  onChange: (contact: Contact) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [active, setActive] = useState<"phone" | "email" | "document" | null>("phone");

  const set = (patch: Partial<Contact>) => onChange({ ...contact, ...patch });

  const phoneOk = PHONE_OK.test(contact.phone);
  const emailOk = EMAIL_OK.test(contact.email);
  const docOk = isValidDocument(contact.documentType, contact.documentNumber);
  const placeOk = Boolean(contact.city && contact.dealership);
  const ready =
    phoneOk && emailOk && docOk && placeOk && contact.dataConsent && contact.commercialConsent;

  return (
    <ScreenShell
      eyebrow="Último paso"
      title={
        <>
          Te mandamos
          <br />
          <span className="text-gradient">tu simulación.</span>
        </>
      }
      subtitle="Para que la puedas mostrar en casa con los números en la mano."
      onBack={onBack}
      onNext={active === null ? onSubmit : undefined}
      nextLabel="Enviar y liberar el humo"
      nextDisabled={!ready}
      nextBusy={submitting}
      footerNote={active === null ? config.copy.legalNotice : undefined}
    >
      <div className="flex flex-col gap-[1.1rem]">
        <FieldButton
          label="Celular"
          value={contact.phone}
          placeholder="300 000 0000"
          valid={phoneOk}
          active={active === "phone"}
          onPress={() => setActive("phone")}
        />

        <FieldButton
          label="Correo"
          value={contact.email}
          placeholder="tunombre@correo.com"
          valid={emailOk}
          active={active === "email"}
          onPress={() => setActive("email")}
        />

        {/* Documento, como lo exige el formulario SGC. */}
        <div>
          <p className="mb-[0.5rem] text-[0.85rem] font-medium text-fg-dim">Documento</p>
          <div className="mb-[0.6rem] flex gap-[0.45rem]">
            {DOCUMENT_TYPES.map((dt) => (
              <button
                key={dt}
                type="button"
                onClick={() => set({ documentType: dt, documentNumber: "" })}
                data-selected={contact.documentType === dt}
                className="chip flex-1 px-[0.5rem] py-[0.7rem] text-center text-[0.78rem] font-semibold leading-tight"
              >
                {dt.replace("Cédula de ", "C. ")}
              </button>
            ))}
          </div>
          <FieldButton
            label=""
            value={contact.documentNumber}
            placeholder="Número de documento"
            valid={docOk}
            active={active === "document"}
            onPress={() => setActive("document")}
          />
        </div>
      </div>

      {active === "phone" && (
        <OnScreenKeyboard
          mode="numeric"
          onKey={(char) => set({ phone: (contact.phone + char).slice(0, 10) })}
          onBackspace={() => set({ phone: contact.phone.slice(0, -1) })}
          onDone={() => setActive("email")}
          doneDisabled={!phoneOk}
        />
      )}

      {active === "email" && (
        <OnScreenKeyboard
          mode="email"
          onKey={(char) =>
            set({ email: (contact.email + char).toLowerCase().slice(0, 80) })
          }
          onBackspace={() => set({ email: contact.email.slice(0, -1) })}
          onDone={() => setActive("document")}
          doneLabel="Siguiente: documento"
          doneDisabled={!emailOk}
        />
      )}

      {active === "document" && (
        <OnScreenKeyboard
          mode={contact.documentType === "Pasaporte" ? "email" : "numeric"}
          onKey={(char) =>
            set({
              documentNumber: (contact.documentNumber + char)
                .replace(/[^A-Za-z0-9]/g, "")
                .toUpperCase()
                .slice(0, 15),
            })
          }
          onBackspace={() => set({ documentNumber: contact.documentNumber.slice(0, -1) })}
          onDone={() => setActive(null)}
          doneLabel="Listo"
          doneDisabled={!docOk}
        />
      )}

      {/* Ciudad y concesionario (valores del formulario SGC). */}
      {active === null && (
        <div className="mt-[1.4rem]">
          <p className="mb-[0.5rem] text-[0.85rem] font-medium text-fg-dim">
            ¿En qué concesionario te gustaría que te atiendan?
          </p>
          <div className="flex gap-[0.45rem]">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ city: c, dealership: DEALERSHIPS[c].length === 1 ? DEALERSHIPS[c][0] : "" })}
                data-selected={contact.city === c}
                className="chip flex-1 py-[0.75rem] text-center text-[0.85rem] font-semibold"
              >
                {c}
              </button>
            ))}
          </div>
          {contact.city && DEALERSHIPS[contact.city]?.length > 1 && (
            <div className="mt-[0.6rem] flex flex-wrap gap-[0.45rem]">
              {DEALERSHIPS[contact.city].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set({ dealership: d })}
                  data-selected={contact.dealership === d}
                  className="chip px-[0.9rem] py-[0.7rem] text-[0.8rem] font-medium"
                >
                  {d.replace("Metrokia - ", "")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {active === null && (
        <div className="mt-[1.6rem] flex flex-col gap-[0.7rem]">
          <p className="text-[0.8rem] text-fg-dim">
            Las mismas autorizaciones del sitio de Kia Colombia. Las dos primeras
            son necesarias para poder enviarte la simulación.
          </p>

          <Consent
            checked={contact.dataConsent}
            onToggle={() => set({ dataConsent: !contact.dataConsent })}
            required
          >
            Autorizo a Metrokia S.A. el tratamiento de mis datos personales de
            acuerdo con su{" "}
            <Legal href="https://www.metrokia.co/politica-de-tratamiento-de-datos-personales">
              Política de tratamiento de datos personales
            </Legal>{" "}
            y la Ley 1581 de 2012. <em>(Requerido)</em>
          </Consent>

          <Consent
            checked={contact.commercialConsent}
            onToggle={() => set({ commercialConsent: !contact.commercialConsent })}
            required
          >
            Autorizo el uso de mis datos para el envío de mensajes, correos
            electrónicos y llamadas con fines comerciales y tributarios.{" "}
            <Legal href="https://www.metrokia.co/terminos-y-condiciones">Términos y condiciones</Legal>.{" "}
            <em>(Requerido)</em>
          </Consent>

          <Consent
            checked={contact.marketingConsent}
            onToggle={() => set({ marketingConsent: !contact.marketingConsent })}
          >
            Autorizo el uso de mis datos para el envío de mensajes, correos
            electrónicos y llamadas con fines de mercadeo. <em>(Opcional)</em>
          </Consent>

          {error && (
            <p className="rounded-[1rem] border border-[rgba(255,149,120,.35)] bg-[rgba(255,149,120,.08)] px-[1.1rem] py-[0.85rem] text-[0.85rem] text-[#ffb59c]">
              {error}
            </p>
          )}
        </div>
      )}
    </ScreenShell>
  );
}

function FieldButton({
  label,
  value,
  placeholder,
  valid,
  active,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  valid: boolean;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button type="button" onClick={onPress} className="text-left">
      <p className="mb-[0.5rem] text-[0.85rem] font-medium text-fg-dim">{label}</p>
      <div
        className="field flex items-center justify-between px-[1.3rem] py-[1.2rem] text-[1.2rem]"
        style={
          active
            ? {
                borderColor: "rgba(0,204,252,.6)",
                background: "rgba(0,204,252,.06)",
              }
            : undefined
        }
      >
        <span className={value ? "numeric text-fg" : "text-fg-mute"}>
          {value || placeholder}
        </span>
        <span
          className="text-[1.05rem]"
          style={{ color: valid ? "var(--accent-lime)" : "var(--fg-mute)" }}
        >
          {valid ? "✓" : "✎"}
        </span>
      </div>
    </button>
  );
}

/**
 * Enlace legal dentro de una casilla. Detiene la propagación para que
 * tocarlo no marque/desmarque la casilla; en el tótem abre en la misma
 * ventana, así que se abre en pestaña nueva y con rel seguro.
 */
function Legal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-[var(--accent)] underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function Consent({
  checked,
  onToggle,
  children,
  required = false,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className="flex items-start gap-[0.95rem] rounded-[1.2rem] border border-line bg-white/[0.025] px-[1.15rem] py-[1.05rem] text-left transition-colors duration-200"
      style={
        checked
          ? { borderColor: "rgba(0,204,252,.45)", background: "rgba(0,204,252,.06)" }
          : undefined
      }
    >
      <span
        className="mt-[0.1rem] flex h-[1.5rem] w-[1.5rem] shrink-0 items-center justify-center rounded-[0.5rem] border text-[0.85rem] font-bold transition-colors duration-200"
        style={{
          borderColor: checked ? "var(--accent)" : "var(--line-strong)",
          background: checked ? "var(--accent)" : "transparent",
          color: "#ffffff",
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="text-[0.8rem] leading-[1.5] text-fg-dim">
        {required && <span className="text-[var(--accent)]">* </span>}
        {children}
      </span>
    </button>
  );
}
