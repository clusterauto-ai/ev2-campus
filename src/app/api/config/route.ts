import { NextResponse } from "next/server";

import { getConfig, saveConfig } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";
import { DEFAULT_CONFIG } from "@/lib/defaultConfig";
import type { AppConfig } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lectura pública: el tótem la necesita para armar la experiencia. */
export async function GET() {
  return NextResponse.json(await getConfig());
}

/** Escritura solo desde el panel de administración. */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let incoming: AppConfig;
  try {
    incoming = (await request.json()) as AppConfig;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validaciones que evitan que un dedo suelto deje el simulador
  // devolviendo números imposibles en plena activación.
  const price = Number(incoming.vehicle?.price);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "El precio del vehículo debe ser mayor a cero." },
      { status: 400 },
    );
  }

  const rate = Number(incoming.financing?.annualRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 60) {
    return NextResponse.json(
      { error: "La tasa efectiva anual debe estar entre 0% y 60%." },
      { status: 400 },
    );
  }

  const terms = (incoming.financing?.terms ?? []).filter(
    (t) => Number.isFinite(t) && t > 0 && t <= 120,
  );
  if (terms.length === 0) {
    return NextResponse.json(
      { error: "Define al menos un plazo válido." },
      { status: 400 },
    );
  }

  const downPaymentOptions = (incoming.financing?.downPaymentOptions ?? []).filter(
    (p) => Number.isFinite(p) && p >= 0 && p < 100,
  );
  if (downPaymentOptions.length === 0) {
    return NextResponse.json(
      { error: "Define al menos una opción de cuota inicial." },
      { status: 400 },
    );
  }

  const normalized: AppConfig = {
    vehicle: { ...DEFAULT_CONFIG.vehicle, ...incoming.vehicle, price },
    financing: {
      ...DEFAULT_CONFIG.financing,
      ...incoming.financing,
      annualRate: rate,
      terms: [...new Set(terms)].sort((a, b) => a - b),
      downPaymentOptions: [...new Set(downPaymentOptions)].sort((a, b) => a - b),
      defaultTerm: terms.includes(Number(incoming.financing?.defaultTerm))
        ? Number(incoming.financing.defaultTerm)
        : terms[Math.floor(terms.length / 2)],
      defaultDownPayment: downPaymentOptions.includes(
        Number(incoming.financing?.defaultDownPayment),
      )
        ? Number(incoming.financing.defaultDownPayment)
        : downPaymentOptions[0],
    },
    usage: { ...DEFAULT_CONFIG.usage, ...incoming.usage },
    habits: (incoming.habits ?? DEFAULT_CONFIG.habits)
      .filter((h) => h && typeof h.id === "string" && h.id.length > 0)
      .map((h) => ({
        ...h,
        unitCost: Math.max(0, Number(h.unitCost) || 0),
        max: Math.max(1, Math.min(30, Number(h.max) || 1)),
        defaultCount: Math.max(0, Number(h.defaultCount) || 0),
        period: h.period === "month" ? "month" : "week",
        active: h.active !== false,
      })),
    copy: { ...DEFAULT_CONFIG.copy, ...incoming.copy },
  };

  return NextResponse.json(await saveConfig(normalized));
}

/** Restablece la configuración a los valores de fábrica documentados. */
export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await saveConfig(DEFAULT_CONFIG));
}
