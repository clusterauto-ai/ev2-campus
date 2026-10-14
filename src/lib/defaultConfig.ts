import type { AppConfig } from "./types";

/**
 * Valores por defecto de la experiencia.
 *
 * Todas las cifras salen de fuentes públicas de 2026 y están documentadas
 * en el README. Son el punto de partida: el equipo de marketing y la
 * financiera aliada las ajustan desde /admin sin tocar este archivo.
 */
export const DEFAULT_CONFIG: AppConfig = {
  vehicle: {
    name: "Kia EV2",
    trim: "Air",
    price: 89_990_000,
    batteryKwh: 42.2,
    rangeKm: 312,
    horsepower: 145,
    torqueNm: 250,
    chargeTimeLabel: "10% a 80% en 30 min",
    warrantyLabel: "8 años / 160.000 km",
  },

  financing: {
    // Propuesta "Plan Movilidad EV2" de Banco Finandina (oct 2026):
    // tasa preferencial desde 1,33% M.V. (equivale a 17,18% E.A.),
    // referencia agosto y sujeta a perfil; hasta 96 meses y hasta el
    // 100% financiado sin cuota inicial obligatoria, según scoring.
    financierName: "Banco Finandina",
    rateNote: "Tasa preferencial Finandina desde 1,33% M.V. según perfil",
    offerFirstYearInterestOnly: true,
    annualRate: 17.18,
    terms: [48, 60, 72, 84, 96],
    defaultTerm: 96,
    downPaymentOptions: [0, 10, 20, 30],
    defaultDownPayment: 0,
    monthlyInsurance: 185_000,
    monthlyAdminFee: 0,
  },

  usage: {
    monthlyKm: 800,
    // Tarifa residencial promedio en Bogotá (estrato 3).
    kwhPrice: 650,
    gasolinePricePerGallon: 16_267,
    gasolineKmPerGallon: 14,
    // Tope legal del impuesto de rodamiento: 1% del valor comercial.
    vehicleTaxRate: 1,
    // Bogotá: 60% de descuento durante los 5 años siguientes a la matrícula.
    vehicleTaxDiscount: 60,
    gasolineYearlyMaintenance: 1_400_000,
    evYearlyMaintenance: 620_000,
  },

  habits: [
    {
      id: "rumba",
      label: "Salir de rumba",
      hint: "Cover, trago y el regreso a la casa",
      icon: "🎧",
      unitCost: 130_000,
      period: "month",
      max: 12,
      defaultCount: 2,
      active: true,
    },
    {
      id: "domicilios",
      label: "Pedir domicilio",
      hint: "El antojo de las 11 de la noche",
      icon: "🛵",
      unitCost: 38_000,
      period: "month",
      max: 30,
      defaultCount: 4,
      active: true,
    },
    {
      id: "cafe",
      label: "Café de especialidad",
      hint: "El de la cafetería de siempre",
      icon: "☕",
      unitCost: 14_000,
      period: "month",
      max: 30,
      defaultCount: 8,
      active: true,
    },
    {
      id: "almuerzo",
      label: "Almorzar fuera",
      hint: "En vez de llevar de la casa",
      icon: "🍽️",
      unitCost: 28_000,
      period: "month",
      max: 30,
      defaultCount: 4,
      active: true,
    },
    {
      id: "suscripciones",
      label: "Suscripciones",
      hint: "Las que tienes y no usas",
      icon: "📺",
      unitCost: 48_000,
      period: "month",
      max: 4,
      defaultCount: 1,
      active: true,
    },
    {
      id: "compras",
      label: "Compras online",
      hint: "Ropa, tenis, gadgets",
      icon: "🛍️",
      unitCost: 180_000,
      period: "month",
      max: 4,
      defaultCount: 1,
      active: true,
    },
    {
      id: "planes",
      label: "Plan de fin de semana",
      hint: "Salir de Bogotá con los amigos",
      icon: "🏔️",
      // Ajustado de 320k a 120k por feedback de marketing (más realista).
      unitCost: 120_000,
      period: "month",
      max: 3,
      defaultCount: 1,
      active: true,
    },
    {
      id: "juegos",
      label: "Gaming y apuestas",
      hint: "Skins, pases de batalla, parley",
      icon: "🎮",
      unitCost: 90_000,
      period: "month",
      max: 5,
      defaultCount: 0,
      active: false,
    },
  ],

  copy: {
    eventName: "EV2 Campus",
    heroTitle: "Tu primer carro\npuede ser eléctrico",
    heroSubtitle:
      "Descubre qué tan cerca estás del Kia EV2, con tus números reales.",
    ctaStart: "Empezar",
    closingMessage:
      "Un asesor Kia te contactará muy pronto con tu simulación lista.",
    legalNotice:
      "Valores estimados con fines informativos; no constituyen oferta comercial ni aprobación de crédito. Financiación otorgada por Banco Finandina, sujeta a estudio, scoring y políticas vigentes. Tasas de referencia que pueden variar.",
  },
};
