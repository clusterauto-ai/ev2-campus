"use client";

/**
 * Fondo ambiental según los mockups de la agencia: azul noche con un
 * haz de luz diagonal cian y orbes de luz muy lentos. Cuando llegue la
 * foto oficial del carro (sin UI), este componente recibe la imagen de
 * fondo y estas luces pasan a ser el "grading" encima.
 */
export function Ambient({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="ambient" aria-hidden="true">
      {/* Degradado base: túnel azul noche del mockup. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #002c41 0%, #011d2e 34%, #010f1d 68%, #000a14 100%)",
        }}
      />

      {/* Haz diagonal de luz, como el reflejo del piso en la foto. */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background:
            "linear-gradient(115deg, transparent 38%, rgba(0,168,252,0.10) 47%, rgba(0,204,252,0.16) 50%, rgba(0,168,252,0.08) 54%, transparent 62%)",
          opacity: 0.9 * intensity,
        }}
      />

      <div
        className="orb animate-drift"
        style={{
          width: "62vh",
          height: "62vh",
          top: "-14vh",
          left: "-16vh",
          background: "radial-gradient(circle, rgba(0,108,144,.55), transparent 66%)",
          opacity: 0.5 * intensity,
        }}
      />
      <div
        className="orb animate-drift"
        style={{
          width: "52vh",
          height: "52vh",
          bottom: "4vh",
          right: "-18vh",
          background: "radial-gradient(circle, rgba(0,168,252,.35), transparent 68%)",
          opacity: 0.38 * intensity,
          animationDelay: "-7s",
        }}
      />
      <div
        className="orb animate-drift"
        style={{
          width: "44vh",
          height: "44vh",
          top: "46%",
          left: "34%",
          background: "radial-gradient(circle, rgba(0,204,252,.2), transparent 70%)",
          opacity: 0.26 * intensity,
          animationDelay: "-13s",
        }}
      />

      {/* Líneas de luz en los muros, como en la foto del túnel. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: "62%",
          top: "38%",
          height: "2px",
          background: "linear-gradient(90deg, rgba(95,225,255,.5), transparent)",
          filter: "blur(1px)",
          opacity: 0.7 * intensity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "62%",
          right: 0,
          top: "42%",
          height: "2px",
          background: "linear-gradient(270deg, rgba(95,225,255,.4), transparent)",
          filter: "blur(1px)",
          opacity: 0.7 * intensity,
        }}
      />
    </div>
  );
}
