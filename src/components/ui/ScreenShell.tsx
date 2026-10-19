"use client";

import { useEffect, useState } from "react";

/**
 * Marco común de las pantallas del flujo: encabezado, cuerpo que crece
 * y una barra de navegación SIEMPRE visible (fija abajo).
 *
 * Decisiones de tótem táctil (feedback oct 2026):
 *  - "Continuar" nunca puede quedar escondido al fondo del scroll:
 *    la botonera flota fija sobre el contenido, con un degradado
 *    para que el contenido se funda bajo ella.
 *  - Cuando hay más contenido por ver, aparece una flecha "Desliza"
 *    animada: sin ella, en una pantalla táctil nadie sabe que hay más.
 */
export function ScreenShell({
  eyebrow,
  title,
  subtitle,
  children,
  onBack,
  backLabel = "Atrás",
  onNext,
  nextLabel = "Continuar",
  nextDisabled = false,
  nextBusy = false,
  footerNote,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
  footerNote?: React.ReactNode;
}) {
  const hasFooter = Boolean(onBack || onNext);

  return (
    <div className={`flex flex-1 flex-col px-[2.2rem] pt-[2.4rem] ${hasFooter ? "pb-[0.5rem]" : "pb-[2.4rem]"}`}>
      <div className="animate-fade-up">
        {eyebrow && <p className="eyebrow mb-[0.9rem]">{eyebrow}</p>}
        <h1 className="display text-[2.9rem] text-fg">{title}</h1>
        {subtitle && (
          <p className="mt-[0.9rem] max-w-[34rem] text-[1.02rem] leading-[1.5] text-fg-dim">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-[2rem] flex flex-1 flex-col">{children}</div>

      {hasFooter && (
        <>
          <div
            className="sticky bottom-0 z-30 -mx-[2.2rem] mt-[1.4rem] px-[2.2rem] pb-[1.3rem] pt-[2.2rem]"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(1,15,29,0.88) 34%, rgba(1,15,29,0.98) 100%)",
            }}
          >
            {/* Anclada al borde de la botonera: nunca tapa contenido. */}
            <ScrollHint />
            {footerNote && (
              <p className="mb-[0.8rem] text-center text-[0.72rem] leading-[1.5] text-fg-mute">
                {footerNote}
              </p>
            )}
            <div className="flex items-center gap-[0.85rem]">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="btn btn-ghost px-[1.8rem] py-[1.15rem] text-[0.95rem]"
                >
                  {backLabel}
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled || nextBusy}
                  className="btn btn-primary flex-1 py-[1.15rem] text-[1.05rem]"
                >
                  {nextBusy ? "Enviando…" : nextLabel}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Flecha "Desliza" que aparece solo cuando queda contenido por ver y
 * desaparece al acercarse al fondo. No captura toques (pointer-events
 * none): es pura señalización.
 */
function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const remaining =
        document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      setVisible(remaining > 120);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // El contenido cambia de alto al abrir teclados o desplegar bloques.
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      observer.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-[1.4rem] left-1/2 z-40 -translate-x-1/2"
    >
      <div
        className="flex animate-bounce items-center gap-[0.45rem] rounded-full border border-[rgba(0,204,252,.4)] px-[1rem] py-[0.45rem] text-[0.78rem] font-medium text-fg"
        style={{
          background: "rgba(2,32,46,0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 0 24px -6px rgba(0,168,252,.6)",
        }}
      >
        Desliza
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[0.95rem] w-[0.95rem] text-[var(--accent-ice)]">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
