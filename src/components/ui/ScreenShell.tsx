"use client";

/**
 * Marco común de las pantallas del flujo: encabezado, cuerpo que crece
 * y una barra de navegación anclada abajo, dentro del alcance del pulgar.
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
  return (
    <div className="flex flex-1 flex-col px-[2.2rem] pb-[2.4rem] pt-[2.4rem]">
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

      {(onBack || onNext) && (
        <div className="mt-[1.8rem] flex flex-col gap-[1rem]">
          {footerNote && (
            <p className="text-center text-[0.72rem] leading-[1.5] text-fg-mute">
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
      )}
    </div>
  );
}
