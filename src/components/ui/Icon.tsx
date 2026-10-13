"use client";

/**
 * Iconos outline según el guideline Kia (pág. 7-8): trazo 1.8, esquinas
 * suaves, monocromo. Se referencian por id o por el emoji que usaba la
 * versión anterior, así la configuración guardada del admin no se rompe:
 * un emoji desconocido simplemente se muestra tal cual.
 */

const PATHS: Record<string, React.ReactNode> = {
  martini: (
    <>
      <path d="M4 5h16L12 14v6" />
      <path d="M8 20h8" />
      <path d="M7.5 8.5h9" />
    </>
  ),
  bag: (
    <>
      <path d="M6.2 8h11.6l1 12H5.2l1-12Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 10h12v5.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10Z" />
      <path d="M16 11h1.6a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M8 6.5c0-1 .9-1.2.9-2.2M11.6 6.5c0-1 .9-1.2.9-2.2" />
    </>
  ),
  cutlery: (
    <>
      <path d="M7 3v6a2 2 0 0 0 4 0V3" />
      <path d="M9 9v12" />
      <path d="M16.5 3c-1.6 2.2-2 4.4-2 6.2 0 1.8 1 2.8 2 2.8v9" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8.5 3.5 12 7l3.5-3.5" />
    </>
  ),
  shopping: (
    <>
      <path d="M5 9h14l-1.2 11H6.2L5 9Z" />
      <path d="M9 12V7a3 3 0 0 1 6 0v5" />
    </>
  ),
  mountain: (
    <>
      <path d="M3 18.5 9 8l4 6.5L16 10l5 8.5H3Z" />
    </>
  ),
  gamepad: (
    <>
      <rect x="3" y="8" width="18" height="10" rx="4" />
      <path d="M8 11v4M6 13h4" />
      <path d="M15.5 12h.01M17.8 14h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9 12 3.5Z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  car: (
    <>
      <path d="M4.5 15l1.4-4.6A2 2 0 0 1 7.8 9h8.4a2 2 0 0 1 1.9 1.4L19.5 15" />
      <path d="M3.5 15h17v4h-2.6v-1.4H6.1V19H3.5v-4Z" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9 12 4.5 20.5 9v1h-17V9Z" />
      <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7" />
      <path d="M3.5 19.5h17" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.2c0 4.4-2.9 7.3-7 8.8-4.1-1.5-7-4.4-7-8.8V6l7-2.5Z" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2.5 5.5 13H10.5l-1 8.5L17 10.5h-5l1-8Z" />
    </>
  ),
  grad: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
      <path d="M6.5 11.5V15c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-3.5" />
      <path d="M21.5 9.5v4.5" />
    </>
  ),
  money: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10" />
      <path d="M14.6 9.4c0-1-1.2-1.7-2.6-1.7s-2.6.7-2.6 1.7c0 2.4 5.2 1.2 5.2 3.7 0 1-1.2 1.7-2.6 1.7s-2.6-.7-2.6-1.7" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="8.5" r="4.2" />
      <path d="M11.5 11.5 20 20M17 17l2.2-2.2M14.2 14.2l2.2-2.2" />
    </>
  ),
  check: (
    <>
      <path d="M4.5 12.5l5 5L19.5 6.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
};

/** Traducción de los emojis de la versión anterior al set oficial. */
const ALIAS: Record<string, string> = {
  "🎧": "martini",
  "🍸": "martini",
  "🛵": "bag",
  "☕": "coffee",
  "🍽️": "cutlery",
  "📺": "tv",
  "🛍️": "shopping",
  "🏔️": "mountain",
  "🎮": "gamepad",
  "✨": "sparkle",
  "🚕": "car",
  "🚦": "car",
  "🏦": "bank",
  "🛡️": "shield",
  "⚡": "bolt",
  "🎓": "grad",
  "💸": "money",
  "🔑": "key",
  "🔒": "shield",
  "🎉": "sparkle",
  "✂️": "sparkle",
  "＋": "plus",
  rumba: "martini",
  domicilios: "bag",
  cafe: "coffee",
  almuerzo: "cutlery",
  suscripciones: "tv",
  compras: "shopping",
  planes: "mountain",
  juegos: "gamepad",
};

export function Icon({
  name,
  className = "",
  size = "1.6rem",
}: {
  name: string;
  className?: string;
  size?: string;
}) {
  const key = PATHS[name] ? name : ALIAS[name];
  const paths = key ? PATHS[key] : null;

  // Emoji o texto que no está en el set: se muestra tal cual para no
  // romper hábitos personalizados creados desde el admin.
  if (!paths) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {name}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
