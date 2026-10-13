import { NextResponse } from "next/server";

import { listLeads } from "@/lib/store";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  "id",
  "createdAt",
  "eventName",
  "totemId",
  "fullName",
  "age",
  "university",
  "program",
  "semester",
  "phone",
  "email",
  "city",
  "autorizaDatos",
  "autorizaComercial",
  "autorizaMercadeo",
  "tier",
  "score",
  "cuotaMensual",
  "costoRealMensual",
  "aporteEstudiante",
  "brechaFamiliar",
  "cobertura",
  "plazoMeses",
  "cuotaInicial",
  "retoma",
  "montoFinanciado",
  "ahorroElectrico",
  "crmEstado",
  "crmSalesforceId",
] as const;

/** Escapa un valor para CSV y neutraliza fórmulas de Excel. */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const leads = await listLeads(5000);

  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.createdAt,
      lead.eventName,
      lead.totemId,
      lead.fullName,
      lead.age ?? "",
      lead.university,
      lead.program,
      lead.semester,
      lead.phone,
      lead.email,
      lead.city,
      lead.dataConsent ? "SI" : "NO",
      lead.commercialConsent ? "SI" : "NO",
      lead.marketingConsent ? "SI" : "NO",
      lead.tier,
      lead.score,
      Math.round(lead.result.monthlyCommitment),
      Math.round(lead.result.realMonthlyCost),
      Math.round(lead.result.studentCapacity),
      Math.round(lead.result.familyGap),
      `${Math.round(lead.result.coveragePct)}%`,
      lead.result.termMonths,
      Math.round(lead.result.downPayment),
      Math.round(lead.result.tradeInValue ?? 0),
      Math.round(lead.result.financed ?? 0),
      Math.round(lead.result.evSaving),
      lead.crm?.status ?? "sin CRM",
      lead.crm?.salesforceId ?? "",
    ]
      .map(csvCell)
      .join(";"),
  );

  // BOM + separador ';' para que Excel en español lo abra en columnas.
  const csv = `﻿${COLUMNS.map(csvCell).join(";")}\n${rows.join("\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-ev2-campus-${stamp}.csv"`,
    },
  });
}
