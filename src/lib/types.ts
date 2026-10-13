/**
 * Tipos compartidos de la experiencia EV2 Campus.
 * Todo lo que el administrador puede tocar vive en `AppConfig`.
 */

export type HabitPeriod = "week" | "month";

/** Un hábito de gasto que el estudiante puede decidir recortar. */
export interface Habit {
  id: string;
  label: string;
  /** Frase corta que se muestra bajo el título en el tótem. */
  hint: string;
  icon: string;
  /** Costo de UNA ocurrencia, en pesos. */
  unitCost: number;
  period: HabitPeriod;
  /** Tope del selector para que nadie cuadre la cuota con 40 rumbas. */
  max: number;
  /** Valor con el que arranca seleccionado el hábito. */
  defaultCount: number;
  active: boolean;
}

/** Parámetros del vehículo que se está promocionando. */
export interface VehicleConfig {
  name: string;
  trim: string;
  price: number;
  batteryKwh: number;
  rangeKm: number;
  horsepower: number;
  torqueNm: number;
  chargeTimeLabel: string;
  warrantyLabel: string;
}

/** Condiciones de crédito. Las ajusta la financiera aliada. */
export interface FinancingConfig {
  /** Nombre de la financiera aliada que respalda la oferta. */
  financierName?: string;
  /** Nota corta de tasa para mostrar al usuario (ej: "1,33% M.V. según perfil"). */
  rateNote?: string;
  /** Si la financiera ofrece primer año pagando solo intereses (Plan Cuota Baja). */
  offerFirstYearInterestOnly?: boolean;
  /** Tasa efectiva anual, en porcentaje. Ej: 18.37 */
  annualRate: number;
  /** Plazos ofrecidos, en meses. */
  terms: number[];
  defaultTerm: number;
  /** Porcentajes de cuota inicial ofrecidos. */
  downPaymentOptions: number[];
  defaultDownPayment: number;
  /** Seguro todo riesgo mensual estimado. */
  monthlyInsurance: number;
  /** Cuota de manejo / administración del crédito, mensual. */
  monthlyAdminFee: number;
}

/** Supuestos de costo de uso: energía vs gasolina, impuestos, mantenimiento. */
export interface UsageConfig {
  /** Kilómetros que recorre al mes el usuario tipo. */
  monthlyKm: number;
  /** Precio del kWh residencial, en pesos. */
  kwhPrice: number;
  /** Precio del galón de gasolina corriente, en pesos. */
  gasolinePricePerGallon: number;
  /** Rendimiento de un carro de gasolina comparable, en km por galón. */
  gasolineKmPerGallon: number;
  /** Impuesto vehicular anual antes de descuento, como % del valor comercial. */
  vehicleTaxRate: number;
  /** Descuento de impuesto vehicular para eléctricos en Bogotá, en %. */
  vehicleTaxDiscount: number;
  /** Mantenimiento anual de un carro de gasolina comparable. */
  gasolineYearlyMaintenance: number;
  /** Mantenimiento anual de un eléctrico. */
  evYearlyMaintenance: number;
}

/** Textos editables por marketing sin tocar código. */
export interface CopyConfig {
  eventName: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaStart: string;
  closingMessage: string;
  legalNotice: string;
}

export interface AppConfig {
  vehicle: VehicleConfig;
  financing: FinancingConfig;
  usage: UsageConfig;
  habits: Habit[];
  copy: CopyConfig;
  /** Marca de tiempo de la última edición desde /admin. */
  updatedAt?: string;
}

/** Hábito que el propio estudiante agrega en el tótem ("Otro"). */
export interface CustomHabit {
  id: string;
  label: string;
  unitCost: number;
  period: HabitPeriod;
  count: number;
}

/** Lo que el estudiante selecciona en el flujo. */
export interface SimulationInput {
  termMonths: number;
  /** Cuota inicial en pesos (ahorros, aporte de la familia). */
  downPayment: number;
  /** Valor de un carro usado que entregaría como parte de pago. */
  tradeInValue: number;
  /** Cuánto gasta hoy al mes moviéndose (Uber, TransMilenio, gasolina prestada). */
  currentTransportSpend: number;
  /** id del hábito -> veces por período que está dispuesto a recortar. */
  habitCounts: Record<string, number>;
  /** id del hábito -> costo unitario que el estudiante corrigió. */
  habitCostOverrides: Record<string, number>;
  /** Hábitos que el estudiante agregó por su cuenta. */
  customHabits: CustomHabit[];
  /** Con quién haría el crédito (solo / papás codeudores / suma de ingresos). */
  creditSupport?: string;
}

/** Resultado del motor financiero. */
export interface SimulationResult {
  price: number;
  downPayment: number;
  tradeInValue: number;
  financed: number;
  termMonths: number;
  annualRate: number;
  monthlyRate: number;
  /** Cuota pura del crédito. */
  loanPayment: number;
  /** Cuota + seguro + cuota de manejo. */
  monthlyCommitment: number;
  /**
   * Cuota del primer año con el Plan Cuota Baja de la financiera
   * (solo intereses + seguro). Informativa: la cobertura y la brecha
   * siempre se calculan sobre la cuota plena para no sobreprometer.
   */
  firstYearPayment: number;

  energyCost: number;
  gasolineEquivalentCost: number;
  fuelSaving: number;
  taxSaving: number;
  maintenanceSaving: number;
  /** Suma de los tres ahorros por ser eléctrico. */
  evSaving: number;

  /** Lo que hoy gasta en transporte y dejaría de gastar. */
  transportSaving: number;
  /** Ahorro mensual proveniente de los hábitos recortados. */
  habitsSaving: number;
  /** Detalle por hábito, para mostrar el desglose. */
  habitBreakdown: {
    id: string;
    label: string;
    icon: string;
    count: number;
    unitCost: number;
    period: HabitPeriod;
    /** Gasto por período (semana o mes) = count × unitCost. */
    perPeriod: number;
    monthly: number;
  }[];

  /** Todo lo que el estudiante puede aportar por su cuenta. */
  studentCapacity: number;
  /** Costo real mensual una vez descontados los ahorros del eléctrico. */
  realMonthlyCost: number;
  /** Lo que faltaría después del aporte del estudiante. Nunca negativo. */
  familyGap: number;
  /** Porcentaje de la cuota que cubre el estudiante (0-100). */
  coveragePct: number;
  /** Costo total del crédito a lo largo del plazo. */
  totalPaid: number;
  totalInterest: number;
}

/** El lead que se guarda en Firestore y se envía al CRM. */
export interface Lead {
  id: string;
  createdAt: string;
  eventName: string;
  totemId: string;

  fullName: string;
  /** Nombres y apellidos separados, como los exige el formulario SGC. */
  firstName: string;
  lastName: string;
  /** Documento de identidad (requerido por SGC). */
  documentType: string;
  documentNumber: string;
  age: number | null;
  university: string;
  program: string;
  semester: string;
  phone: string;
  email: string;
  /** Ciudad y concesionario elegidos (valores del formulario SGC). */
  city: string;
  dealership: string;

  /** 1. Autorización de tratamiento de datos personales (obligatoria). */
  dataConsent: boolean;
  /** 2. Contacto con fines comerciales y tributarios (obligatoria). */
  commercialConsent: boolean;
  /** 3. Contacto con fines de mercadeo (opcional). */
  marketingConsent: boolean;

  simulation: SimulationInput;
  result: Pick<
    SimulationResult,
    | "monthlyCommitment"
    | "realMonthlyCost"
    | "studentCapacity"
    | "familyGap"
    | "coveragePct"
    | "termMonths"
    | "downPayment"
    | "tradeInValue"
    | "financed"
    | "evSaving"
  >;

  /** Clasificación automática para priorizar el seguimiento comercial. */
  score: number;
  tier: "caliente" | "tibio" | "frio";

  /** Estado de la sincronización con el CRM (se llena tras el envío). */
  crm?: {
    status: "enviado" | "error" | "pendiente";
    mode?: "rest" | "web-to-lead" | "webhook";
    salesforceId?: string;
    error?: string;
    syncedAt?: string;
  };
}
