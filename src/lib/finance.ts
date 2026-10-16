import type {
  AppConfig,
  Habit,
  Lead,
  SimulationInput,
  SimulationResult,
} from "./types";

/** 52 semanas / 12 meses. Evita el error clásico de asumir 4 semanas. */
export const WEEKS_PER_MONTH = 52 / 12;

/** Convierte una tasa efectiva anual (en %) a su equivalente mensual. */
export function monthlyRateFromAnnual(annualRatePct: number): number {
  return Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
}

/**
 * Cuota fija de un crédito por sistema de amortización francés.
 * Es el que usan los bancos en Colombia para crédito de vehículo.
 */
export function frenchPayment(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * growth) / (growth - 1);
}

/** Ahorro mensual que representa recortar un hábito N veces por período. */
export function habitMonthlySaving(habit: Habit, count: number): number {
  const times = Math.max(0, Math.min(count, habit.max));
  const multiplier = habit.period === "week" ? WEEKS_PER_MONTH : 1;
  return habit.unitCost * times * multiplier;
}

/**
 * Motor principal. Toma la configuración vigente y lo que eligió el
 * estudiante, y devuelve el panorama completo: cuota, ahorros por ser
 * eléctrico, cuánto puede poner él y cuánto tendría que poner la familia.
 */
export function simulate(
  config: AppConfig,
  input: SimulationInput,
): SimulationResult {
  const { vehicle, financing, usage, habits } = config;

  const price = vehicle.price;
  const isGracePlan = financing.planMode === "graceResidual";

  // La inicial y la retoma no pueden superar el precio: lo que sobre no
  // se financia (y tampoco se "devuelve" en la simulación).
  const tradeInValue = Math.max(0, Math.min(input.tradeInValue || 0, price));
  // El plan Finandina exige una entrada mínima (inicial + retoma).
  const minDown = isGracePlan
    ? Math.max(0, (price * (financing.minDownPct ?? 0)) / 100 - tradeInValue)
    : 0;
  const downPayment = Math.max(
    minDown,
    Math.min(input.downPayment || 0, price - tradeInValue),
  );
  const financed = Math.max(0, price - downPayment - tradeInValue);
  const monthlyRate = monthlyRateFromAnnual(financing.annualRate);

  const graceMonths = isGracePlan ? (financing.graceMonths ?? 12) : 0;
  const residualValue = isGracePlan
    ? Math.round((price * (financing.residualPct ?? 0)) / 100)
    : 0;

  let loanPayment: number;
  if (isGracePlan) {
    // Plan Período de Gracia Finandina: durante la gracia solo se pagan
    // seguros; los intereses se difieren y capitalizan. Luego se amortiza
    // en (plazo − gracia) cuotas dejando viva la cuota residual.
    // La fórmula exacta del banco vive en su simulador, así que se
    // calibra contra la cifra oficial del folleto (officialBasePayment,
    // caso: inicial mínima y sin retoma); las variantes escalan igual.
    const amortMonths = Math.max(1, input.termMonths - graceMonths);
    const graceFactor = Math.pow(1 + monthlyRate, graceMonths);
    const residualDiscount = Math.pow(1 + monthlyRate, amortMonths);

    const rawFor = (principal: number) =>
      frenchPayment(
        principal * graceFactor - residualValue / residualDiscount,
        monthlyRate,
        amortMonths,
      );

    const baseFinanced = price * (1 - (financing.minDownPct ?? 0) / 100);
    const official = financing.officialBasePayment;
    const calibration =
      official && rawFor(baseFinanced) > 0 ? official / rawFor(baseFinanced) : 1;

    loanPayment = rawFor(financed) * calibration;
  } else {
    loanPayment = frenchPayment(financed, monthlyRate, input.termMonths);
  }

  const monthlyCommitment =
    loanPayment + financing.monthlyInsurance + financing.monthlyAdminFee;

  // Lo que se paga al mes durante la gracia: solo seguros y cargos.
  // (En el plan estándar equivale a primer año de solo intereses.)
  const firstYearPayment = isGracePlan
    ? financing.monthlyInsurance + financing.monthlyAdminFee
    : financed * monthlyRate + financing.monthlyInsurance + financing.monthlyAdminFee;

  const dailyPayment = loanPayment / 30;

  // ── Costo de moverse: electricidad vs gasolina ──────────────────
  const kwhPerKm = vehicle.rangeKm > 0 ? vehicle.batteryKwh / vehicle.rangeKm : 0;
  const energyCost = usage.monthlyKm * kwhPerKm * usage.kwhPrice;
  const gasolineEquivalentCost =
    usage.gasolineKmPerGallon > 0
      ? (usage.monthlyKm / usage.gasolineKmPerGallon) *
        usage.gasolinePricePerGallon
      : 0;
  const fuelSaving = Math.max(0, gasolineEquivalentCost - energyCost);

  // ── Impuesto de rodamiento con el descuento para eléctricos ─────
  const fullTax = (price * usage.vehicleTaxRate) / 100;
  const taxSaving = (fullTax * (usage.vehicleTaxDiscount / 100)) / 12;

  // ── Mantenimiento: un eléctrico tiene muchas menos piezas ───────
  const maintenanceSaving = Math.max(
    0,
    (usage.gasolineYearlyMaintenance - usage.evYearlyMaintenance) / 12,
  );

  const evSaving = fuelSaving + taxSaving + maintenanceSaving;

  // ── Lo que hoy gasta moviéndose y dejaría de gastar ─────────────
  const transportSaving = Math.max(0, input.currentTransportSpend);

  // ── Hábitos que decidió recortar ────────────────────────────────
  // El estudiante puede corregir el costo unitario (no todo el mundo
  // gasta lo mismo en una rumba) y agregar hábitos propios.
  const configured = habits
    .filter((h) => h.active)
    .map((h) => {
      const override = input.habitCostOverrides?.[h.id];
      const unitCost =
        Number.isFinite(override) && (override as number) >= 0
          ? (override as number)
          : h.unitCost;
      const count = Math.max(0, Math.min(input.habitCounts[h.id] ?? 0, h.max));
      const effective: Habit = { ...h, unitCost };
      return {
        id: h.id,
        label: h.label,
        icon: h.icon,
        count,
        unitCost,
        period: h.period,
        perPeriod: unitCost * count,
        monthly: habitMonthlySaving(effective, count),
      };
    });

  const custom = (input.customHabits ?? []).map((c) => {
    const count = Math.max(0, Math.min(c.count || 0, 30));
    const unitCost = Math.max(0, c.unitCost || 0);
    const effective: Habit = {
      id: c.id,
      label: c.label,
      hint: "",
      icon: "✨",
      unitCost,
      period: c.period,
      max: 30,
      defaultCount: 0,
      active: true,
    };
    return {
      id: c.id,
      label: c.label || "Otro",
      icon: "✨",
      count,
      unitCost,
      period: c.period,
      perPeriod: unitCost * count,
      monthly: habitMonthlySaving(effective, count),
    };
  });

  const habitBreakdown = [...configured, ...custom]
    .filter((h) => h.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);

  const habitsSaving = habitBreakdown.reduce((sum, h) => sum + h.monthly, 0);

  // ── Cierre del caso ─────────────────────────────────────────────
  // El costo real es lo que de verdad sale del bolsillo cada mes:
  // cuota + seguro + carga. El ahorro frente a un carro de gasolina se
  // muestra aparte como argumento, NO se descuenta aquí: un estudiante
  // que hoy anda en Uber no está pagando esa gasolina, y restarla
  // inflaría el resultado de una forma que cualquier papá desarma.
  const realMonthlyCost = monthlyCommitment + energyCost;
  const studentCapacity = habitsSaving + transportSaving;
  const familyGap = Math.max(0, realMonthlyCost - studentCapacity);
  const coveragePct =
    realMonthlyCost > 0
      ? Math.min(100, (studentCapacity / realMonthlyCost) * 100)
      : 100;

  const payingMonths = input.termMonths - graceMonths;
  const totalPaid = loanPayment * payingMonths + residualValue + downPayment;
  const totalInterest = Math.max(
    0,
    loanPayment * payingMonths + residualValue - financed,
  );

  return {
    price,
    downPayment,
    tradeInValue,
    financed,
    termMonths: input.termMonths,
    annualRate: financing.annualRate,
    monthlyRate,
    loanPayment,
    monthlyCommitment,
    firstYearPayment,
    dailyPayment,
    residualValue,
    graceMonths,
    energyCost,
    gasolineEquivalentCost,
    fuelSaving,
    taxSaving,
    maintenanceSaving,
    evSaving,
    transportSaving,
    habitsSaving,
    habitBreakdown,
    studentCapacity,
    realMonthlyCost,
    familyGap,
    coveragePct,
    totalPaid,
    totalInterest,
  };
}

/**
 * Construye la frase de cierre que ve el estudiante.
 * Es el momento clave de la experiencia: tiene que ser concreta,
 * honesta y fácil de repetir en la mesa del almuerzo familiar.
 */
export function buildNarrative(result: SimulationResult): {
  headline: string;
  body: string;
  tone: "excelente" | "bueno" | "arranque";
} {
  const top = result.habitBreakdown[0];
  const pct = Math.round(result.coveragePct);

  // Fraseo ajustado por feedback de marketing: debe quedar claro que el
  // ahorro sale de DEJAR el hábito, no de hacerlo.
  const habitPhrase = top
    ? `Solo recortando ${top.label.toLowerCase()} ya liberas ${formatCOP(top.monthly)} al mes.`
    : "Aún no elegiste nada que sacrificar: vuelve y prueba moviendo los controles.";

  if (pct >= 100) {
    return {
      tone: "excelente",
      headline: "El EV2 te alcanza solo.",
      body: `Con lo que ya gastas hoy y lo que decidiste sacrificar, cubres el 100% de lo que cuesta tenerlo cada mes. ${habitPhrase} No necesitas que nadie te complete la cuota.`,
    };
  }

  if (pct >= 45) {
    return {
      tone: "bueno",
      headline: `Ya tienes el ${pct}%.`,
      body: `${habitPhrase} Te faltarían ${formatCOP(result.familyGap)} al mes. Es una conversación muy distinta a llegar a la casa con las manos vacías.`,
    };
  }

  return {
    tone: "arranque",
    headline: `Tu aporte ya vale ${formatCOP(result.studentCapacity)} al mes.`,
    body: `${habitPhrase} Con ${formatCOP(result.familyGap)} mensuales de apoyo, el EV2 deja de ser un "algún día" y pasa a ser una cuenta concreta.`,
  };
}

/**
 * Equivalencias para aterrizar cifras grandes en cosas que un
 * universitario reconoce al instante.
 */
export function buildEquivalences(
  config: AppConfig,
  result: SimulationResult,
): { icon: string; text: string }[] {
  const out: { icon: string; text: string }[] = [];

  const yearlyFuelSaving = result.fuelSaving * 12;
  const domicilio = config.habits.find((h) => h.id === "domicilios");
  if (domicilio && domicilio.unitCost > 0) {
    out.push({
      icon: "🛵",
      text: `Lo que ahorras en gasolina en un año equivale a ${Math.round(
        yearlyFuelSaving / domicilio.unitCost,
      )} domicilios.`,
    });
  }

  out.push({
    icon: "⚡",
    text: `Cargar el EV2 para todo un mes cuesta ${formatCOP(
      result.energyCost,
    )}. Tanquear un carro de gasolina, ${formatCOP(result.gasolineEquivalentCost)}.`,
  });

  out.push({
    icon: "🚦",
    text: "Sin pico y placa en Bogotá: puedes salir los 7 días, incluso en día sin carro.",
  });

  return out;
}

/**
 * Puntaje comercial del lead. Prioriza a quién llama primero el asesor:
 * mide qué tan cerca está la compra, no qué tan bonito quedó el simulador.
 */
export function scoreLead(
  lead: Omit<Lead, "score" | "tier">,
): { score: number; tier: Lead["tier"] } {
  let score = 0;

  // Qué tanto del costo cubre por su cuenta: la señal más fuerte.
  score += Math.min(40, (lead.result.coveragePct / 100) * 40);

  // Mayor de edad: puede firmar el crédito él mismo.
  if (lead.age !== null && lead.age >= 18) score += 10;

  // Semestre avanzado significa ingreso propio más cercano.
  const semester = parseInt(lead.semester, 10);
  if (!Number.isNaN(semester)) score += Math.min(15, semester * 1.5);

  // Datos de contacto utilizables.
  if (/^3\d{9}$/.test(lead.phone.replace(/\D/g, ""))) score += 15;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) score += 10;

  // Aceptó también mercadeo: el lead se puede trabajar por más canales.
  if (lead.marketingConsent) score += 10;

  const rounded = Math.round(Math.min(100, score));
  const tier: Lead["tier"] =
    rounded >= 70 ? "caliente" : rounded >= 45 ? "tibio" : "frio";

  return { score: rounded, tier };
}

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** $1.601.634 */
export function formatCOP(value: number): string {
  return copFormatter.format(Math.round(value || 0));
}

/** 1.6 M — para titulares donde el número completo no cabe. */
export function formatCompactCOP(value: number): string {
  const v = Math.round(value || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)} mil`;
  return `$${v}`;
}

/** Entrada por defecto del simulador, derivada de la configuración. */
export function defaultSimulationInput(config: AppConfig): SimulationInput {
  const habitCounts: Record<string, number> = {};
  for (const habit of config.habits) {
    if (habit.active) habitCounts[habit.id] = habit.defaultCount;
  }
  return {
    termMonths: config.financing.defaultTerm,
    downPayment: Math.round(
      (config.vehicle.price * config.financing.defaultDownPayment) / 100,
    ),
    tradeInValue: 0,
    currentTransportSpend: 0,
    habitCounts,
    habitCostOverrides: {},
    customHabits: [],
  };
}
