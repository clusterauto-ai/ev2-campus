import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { getConfig, listLeads, saveLead, updateLead } from "@/lib/store";
import { pushToCrm, triggerSmoke } from "@/lib/integrations";
import { isSalesforceConfigured, pushToSalesforce } from "@/lib/salesforce";
import { scoreLead, simulate } from "@/lib/finance";
import { isAuthenticated } from "@/lib/auth";
import { DEALERSHIPS, DOCUMENT_TYPES, isValidDocument } from "@/lib/dealerships";
import type { Lead, SimulationInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deja el celular en 10 dígitos para que el CRM no reciba basura. */
function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.startsWith("57") && digits.length === 12
    ? digits.slice(2)
    : digits;
}

function clean(value: unknown, max = 120): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const fullName = clean(body.fullName);
  const phone = normalizePhone(String(body.phone ?? ""));
  const email = clean(body.email, 160).toLowerCase();
  const dataConsent = body.dataConsent === true;
  const commercialConsent = body.commercialConsent === true;

  // Mismas casillas que el formulario de metrokia.co: tratamiento de
  // datos y contacto comercial son obligatorias (Ley 1581 de 2012);
  // mercadeo es opcional. Sin las dos primeras el lead no se guarda.
  if (!dataConsent || !commercialConsent) {
    return NextResponse.json(
      { error: "Se requieren las dos autorizaciones obligatorias." },
      { status: 400 },
    );
  }

  if (fullName.length < 3) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  if (!/^3\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "El celular debe tener 10 dígitos y empezar por 3." },
      { status: 400 },
    );
  }

  // ── Campos del formulario SGC (metrokia.co/cotizar) ────────────
  const documentType = (DOCUMENT_TYPES as readonly string[]).includes(
    String(body.documentType),
  )
    ? String(body.documentType)
    : "Cédula de ciudadanía";
  const documentNumber = clean(body.documentNumber, 15).toUpperCase();
  if (!isValidDocument(documentType, documentNumber)) {
    return NextResponse.json(
      { error: "Número de documento inválido." },
      { status: 400 },
    );
  }

  const city = clean(body.city, 40);
  const dealership = clean(body.dealership, 60);
  if (!DEALERSHIPS[city] || !DEALERSHIPS[city].includes(dealership)) {
    return NextResponse.json(
      { error: "Selecciona ciudad y concesionario válidos." },
      { status: 400 },
    );
  }

  const config = await getConfig();

  const rawSim = (body.simulation ?? {}) as Partial<SimulationInput>;
  const price = config.vehicle.price;
  const money = (v: unknown, max: number) =>
    Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

  const simulation: SimulationInput = {
    termMonths: config.financing.terms.includes(Number(rawSim.termMonths))
      ? Number(rawSim.termMonths)
      : config.financing.defaultTerm,
    downPayment: money(rawSim.downPayment, price),
    tradeInValue: money(rawSim.tradeInValue, price),
    currentTransportSpend: money(rawSim.currentTransportSpend, 5_000_000),
    habitCounts: {},
    habitCostOverrides: {},
    customHabits: [],
    creditSupport: clean(rawSim.creditSupport, 60),
  };

  // Solo aceptamos hábitos que existan y estén activos en la config vigente.
  for (const habit of config.habits) {
    if (!habit.active) continue;
    const raw = Number((rawSim.habitCounts ?? {})[habit.id]) || 0;
    simulation.habitCounts[habit.id] = Math.max(0, Math.min(habit.max, raw));

    const override = (rawSim.habitCostOverrides ?? {})[habit.id];
    if (override !== undefined && Number.isFinite(Number(override))) {
      simulation.habitCostOverrides[habit.id] = money(override, 5_000_000);
    }
  }

  // Hábitos propios: máximo 5, con topes para que nadie "cuadre" la cuota
  // con un hábito de 50 millones.
  simulation.customHabits = (Array.isArray(rawSim.customHabits) ? rawSim.customHabits : [])
    .slice(0, 5)
    .map((c, i) => ({
      id: `custom-${i}`,
      label: clean(c?.label, 40) || "Otro",
      unitCost: money(c?.unitCost, 5_000_000),
      period: (c?.period === "month" ? "month" : "week") as "month" | "week",
      count: Math.max(0, Math.min(30, Math.round(Number(c?.count) || 0))),
    }))
    .filter((c) => c.unitCost > 0 && c.count > 0);

  // El resultado se recalcula en el servidor: nunca confiamos en los
  // números que llegan del cliente.
  const result = simulate(config, simulation);

  const ageValue = Number(body.age);
  const base: Omit<Lead, "score" | "tier"> = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    eventName: clean(body.eventName) || config.copy.eventName,
    totemId: clean(body.totemId) || "DOMO-01",
    fullName,
    firstName: clean(body.firstName, 40) || fullName.split(" ")[0],
    lastName: clean(body.lastName, 40) || fullName.split(" ").slice(1).join(" "),
    documentType,
    documentNumber,
    age: Number.isFinite(ageValue) && ageValue > 0 ? Math.round(ageValue) : null,
    university: clean(body.university),
    program: clean(body.program),
    semester: clean(body.semester, 10),
    phone,
    email,
    city,
    dealership,
    dataConsent,
    commercialConsent,
    marketingConsent: body.marketingConsent === true,
    simulation,
    result: {
      monthlyCommitment: result.monthlyCommitment,
      realMonthlyCost: result.realMonthlyCost,
      studentCapacity: result.studentCapacity,
      familyGap: result.familyGap,
      coveragePct: result.coveragePct,
      termMonths: result.termMonths,
      downPayment: result.downPayment,
      tradeInValue: result.tradeInValue,
      financed: result.financed,
      evSaving: result.evSaving,
    },
  };

  const lead: Lead = { ...base, ...scoreLead(base) };

  const { persisted } = await saveLead(lead);

  // El CRM y el efecto del domo van en paralelo y sin bloquear la
  // respuesta más de lo necesario: el estudiante está mirando la pantalla.
  // Salesforce tiene prioridad; el webhook genérico es la alternativa si
  // sistemas prefiere un middleware propio.
  const [crm, smoke] = await Promise.all([
    isSalesforceConfigured() ? pushToSalesforce(lead) : pushToCrm(lead),
    triggerSmoke(lead),
  ]);

  if (!("skipped" in crm)) {
    const crmState: NonNullable<Lead["crm"]> = crm.ok
      ? {
          status: "enviado",
          mode: "mode" in crm ? crm.mode : "webhook",
          salesforceId: "salesforceId" in crm ? crm.salesforceId : undefined,
          syncedAt: new Date().toISOString(),
        }
      : {
          status: "error",
          mode: "mode" in crm ? crm.mode : "webhook",
          error: "error" in crm ? crm.error : `HTTP ${"status" in crm ? crm.status : "?"}`,
        };
    await updateLead(lead.id, { crm: crmState });
  }

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    tier: lead.tier,
    persisted,
    crm: crm.ok,
    smoke: smoke.ok,
  });
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ leads: await listLeads() });
}
