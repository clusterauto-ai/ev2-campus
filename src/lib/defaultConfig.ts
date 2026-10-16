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
    // Plan DEFINITIVO Finandina para estudiantes EV2 (oct-nov 2026):
    // "EV2 Recarga Total" — Período de Gracia 12 meses (solo seguros,
    // intereses diferidos), plazo 84 meses, inicial desde 20%,
    // residual 10%, tasa especial simulada 1,33% M.V. (clientes AA).
    // Cifra oficial del banco: cuota mes 13-84 = $1.761.466,52.
    financierName: "Banco Finandina",
    rateNote: "Tasa especial simulada 1,33% M.V. · clientes AA, sujeta a perfil",
    planMode: "graceResidual",
    planLabel: "EV2 Recarga Total · Período de Gracia 12 meses",
    planVigency: "1 de octubre al 30 de noviembre de 2026",
    graceMonths: 12,
    residualPct: 10,
    minDownPct: 20,
    officialBasePayment: 1_761_466.52,
    annualRate: 17.18,
    terms: [84],
    defaultTerm: 84,
    downPaymentOptions: [20, 30, 40],
    defaultDownPayment: 20,
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
      "Valores estimados con fines informativos; no constituyen oferta ni aprobación de crédito. Financiación Banco Finandina sujeta a sus políticas: plan período de gracia 12 meses (los intereses causados se difieren y se pagan en las cuotas siguientes), inicial desde 20%, residual 10%, plazo hasta 84 meses, hasta perfil de riesgo C. La cuota no incluye primas de seguros, que se cobran desde el desembolso. Tasa especial simulada solo clientes AA; puede variar según perfil. Vigencia 1 oct – 30 nov 2026 o hasta cambio de política.",
  },
};
