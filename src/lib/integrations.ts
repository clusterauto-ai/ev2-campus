import type { Lead } from "./types";

/**
 * Salidas hacia sistemas externos: el CRM comercial y el controlador
 * del domo. Ninguna de las dos puede tumbar la captura del lead, así
 * que todo va con timeout y con los errores atrapados.
 */

async function postJson(
  url: string,
  body: unknown,
  token?: string,
  timeoutMs = 4000,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Envía el lead al CRM. El payload usa nombres de campo estilo Salesforce
 * para que el mapeo del lado de sistemas sea directo.
 */
export async function pushToCrm(lead: Lead) {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true as const };

  const payload = {
    FirstName: lead.fullName.split(" ")[0] ?? "",
    LastName: lead.fullName.split(" ").slice(1).join(" ") || lead.fullName,
    Email: lead.email,
    MobilePhone: lead.phone,
    City: lead.city,
    Company: lead.university || "Estudiante",
    LeadSource: "EV2 Campus - Domo",
    Description: `Simulación EV2 · cuota ${Math.round(
      lead.result.monthlyCommitment,
    )} · cubre ${Math.round(lead.result.coveragePct)}% · plazo ${
      lead.result.termMonths
    } meses`,
    Rating:
      lead.tier === "caliente" ? "Hot" : lead.tier === "tibio" ? "Warm" : "Cold",
    // Campos personalizados sugeridos para el objeto Lead.
    EV2_Score__c: lead.score,
    EV2_Cuota__c: Math.round(lead.result.monthlyCommitment),
    EV2_Aporte_Estudiante__c: Math.round(lead.result.studentCapacity),
    EV2_Brecha_Familiar__c: Math.round(lead.result.familyGap),
    EV2_Plazo_Meses__c: lead.result.termMonths,
    EV2_Cuota_Inicial__c: Math.round(lead.result.downPayment),
    EV2_Universidad__c: lead.university,
    EV2_Programa__c: lead.program,
    EV2_Semestre__c: lead.semester,
    EV2_Evento__c: lead.eventName,
    EV2_Totem__c: lead.totemId,
    EV2_Autoriza_Datos__c: lead.dataConsent,
    EV2_Autoriza_Marketing__c: lead.marketingConsent,
    EV2_Lead_Id__c: lead.id,
  };

  return postJson(url, payload, process.env.CRM_WEBHOOK_TOKEN);
}

/**
 * Dispara el efecto del domo (humo, luces, sonido) al cerrar el registro.
 * `intensity` permite que un lead más caliente tenga un show más grande.
 */
export async function triggerSmoke(lead: Lead) {
  const url = process.env.SMOKE_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true as const };

  return postJson(
    url,
    {
      event: "lead_completed",
      leadId: lead.id,
      totemId: lead.totemId,
      tier: lead.tier,
      intensity: lead.tier === "caliente" ? "high" : "standard",
      timestamp: lead.createdAt,
    },
    process.env.SMOKE_WEBHOOK_TOKEN,
    2500,
  );
}
