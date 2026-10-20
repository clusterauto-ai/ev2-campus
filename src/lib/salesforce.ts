import type { Lead } from "./types";

/**
 * Conector a Salesforce. Dos caminos, se elige solo según qué variables
 * de entorno existan:
 *
 *  A) REST API con Connected App (client credentials). Crea el Lead con
 *     la API oficial y devuelve el Id de Salesforce. Es el camino robusto.
 *     Variables: SF_INSTANCE_URL, SF_CLIENT_ID, SF_CLIENT_SECRET.
 *
 *  B) Web-to-Lead. Sin credenciales: solo el OID de la organización.
 *     Marketing lo genera en Setup → Web-to-Lead en dos minutos. Ideal
 *     para el piloto; límite por defecto de 500 leads/día.
 *     Variables: SF_WEB_TO_LEAD_OID.
 *
 * En ambos casos los campos personalizados son opcionales y se mapean
 * con SF_FIELD_MAP (JSON) para no depender de que existan en la org.
 */

/** Claves internas que se pueden mapear a campos de Salesforce. */
export type LeadFieldKey =
  | "score"
  | "tier"
  | "monthlyCommitment"
  | "studentCapacity"
  | "familyGap"
  | "coveragePct"
  | "termMonths"
  | "downPayment"
  | "university"
  | "program"
  | "semester"
  | "age"
  | "eventName"
  | "totemId"
  | "dataConsent"
  | "commercialConsent"
  | "marketingConsent"
  | "tradeInValue"
  | "financed"
  | "documentType"
  | "documentNumber"
  | "dealership"
  | "creditSupport"
  | "leadId";

export function isSalesforceConfigured(): boolean {
  return Boolean(
    (process.env.SF_INSTANCE_URL &&
      process.env.SF_CLIENT_ID &&
      process.env.SF_CLIENT_SECRET) ||
      process.env.SF_WEB_TO_LEAD_OID,
  );
}

/** Valores de los campos internos, ya listos para enviar. */
function fieldValues(lead: Lead): Record<LeadFieldKey, string | number | boolean> {
  return {
    score: lead.score,
    tier: lead.tier,
    monthlyCommitment: Math.round(lead.result.monthlyCommitment),
    studentCapacity: Math.round(lead.result.studentCapacity),
    familyGap: Math.round(lead.result.familyGap),
    coveragePct: Math.round(lead.result.coveragePct),
    termMonths: lead.result.termMonths,
    downPayment: Math.round(lead.result.downPayment),
    university: lead.university,
    program: lead.program,
    semester: lead.semester,
    age: lead.age ?? "",
    eventName: lead.eventName,
    totemId: lead.totemId,
    dataConsent: lead.dataConsent,
    commercialConsent: lead.commercialConsent,
    marketingConsent: lead.marketingConsent,
    tradeInValue: Math.round(lead.result.tradeInValue ?? 0),
    financed: Math.round(lead.result.financed ?? 0),
    documentType: lead.documentType ?? "",
    documentNumber: lead.documentNumber ?? "",
    dealership: lead.dealership ?? "",
    creditSupport: lead.simulation.creditSupport ?? "",
    leadId: lead.id,
  };
}

/** Mapa clave interna → nombre de campo en Salesforce, desde SF_FIELD_MAP. */
function customFieldMap(): Partial<Record<LeadFieldKey, string>> {
  const raw = process.env.SF_FIELD_MAP;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<Record<LeadFieldKey, string>>;
  } catch {
    console.error("[salesforce] SF_FIELD_MAP no es JSON válido; se ignora.");
    return {};
  }
}

/** Resumen legible que siempre viaja en Description, exista o no mapeo. */
function description(lead: Lead): string {
  const v = fieldValues(lead);
  return [
    `EV2 Campus · ${lead.eventName} · tótem ${lead.totemId}`,
    `Documento: ${lead.documentType} ${lead.documentNumber} · Concesionario: ${lead.dealership} (${lead.city})`,
    `Universidad: ${lead.university} · ${lead.program} · semestre ${lead.semester} · ${lead.age ?? "?"} años`,
    `Cuota simulada: $${v.monthlyCommitment} · plazo ${v.termMonths} m · inicial $${v.downPayment} · retoma $${v.tradeInValue} · financia $${v.financed}`,
    `Aporte estudiante: $${v.studentCapacity} · brecha familiar: $${v.familyGap} · cubre ${v.coveragePct}%`,
    `Apoyo para el crédito: ${lead.simulation.creditSupport || "no indicó"}`,
    `Score ${v.score} (${v.tier}) · autoriza datos: ${lead.dataConsent ? "sí" : "no"} · comercial: ${lead.commercialConsent ? "sí" : "no"} · mercadeo: ${lead.marketingConsent ? "sí" : "no"}`,
    `Id interno: ${lead.id}`,
  ].join("\n");
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  // En Colombia lo habitual son dos nombres + dos apellidos; partimos a la mitad.
  const cut = parts.length >= 4 ? 2 : 1;
  return { first: parts.slice(0, cut).join(" "), last: parts.slice(cut).join(" ") };
}

function rating(tier: Lead["tier"]): "Hot" | "Warm" | "Cold" {
  return tier === "caliente" ? "Hot" : tier === "tibio" ? "Warm" : "Cold";
}

// ─────────────────────────────────────────────────────────────────
// A) REST API (Connected App, client credentials)
// ─────────────────────────────────────────────────────────────────

let tokenCache: { token: string; instanceUrl: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<{ token: string; instanceUrl: string }> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache;

  const base = process.env.SF_INSTANCE_URL!.replace(/\/$/, "");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SF_CLIENT_ID!,
    client_secret: process.env.SF_CLIENT_SECRET!,
  });

  const response = await fetch(`${base}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`OAuth ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    instance_url: string;
    issued_at?: string;
  };

  // Los tokens de client credentials duran lo que diga la política de la
  // org (típicamente 2 h). Renovamos conservadoramente cada 50 min.
  tokenCache = {
    token: data.access_token,
    instanceUrl: data.instance_url || base,
    expiresAt: Date.now() + 50 * 60_000,
  };
  return tokenCache;
}

async function pushViaRest(lead: Lead): Promise<SalesforceResult> {
  const { token, instanceUrl } = await getAccessToken();
  // SGC pide nombres y apellidos separados; el split es solo respaldo.
  const first = lead.firstName || splitName(lead.fullName).first;
  const last = lead.lastName || splitName(lead.fullName).last;
  const version = process.env.SF_API_VERSION || "v61.0";

  const payload: Record<string, unknown> = {
    FirstName: first,
    LastName: last || lead.fullName,
    Email: lead.email,
    MobilePhone: lead.phone,
    Phone: lead.phone,
    City: lead.city,
    Country: "Colombia",
    Company: lead.university || "Estudiante",
    LeadSource: process.env.SF_LEAD_SOURCE || "EV2 Campus",
    Rating: rating(lead.tier),
    Description: description(lead),
  };

  // Solo enviamos campos personalizados que la org haya declarado.
  const values = fieldValues(lead);
  for (const [key, sfField] of Object.entries(customFieldMap())) {
    if (sfField) payload[sfField] = values[key as LeadFieldKey];
  }

  const response = await fetch(
    `${instanceUrl}/services/data/${version}/sobjects/Lead`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    },
  );

  if (response.status === 401) tokenCache = null; // forzar renovación

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, mode: "rest", error: `HTTP ${response.status}: ${text.slice(0, 300)}` };
  }

  const data = JSON.parse(text) as { id?: string };
  return { ok: true, mode: "rest", salesforceId: data.id };
}

// ─────────────────────────────────────────────────────────────────
// B) Web-to-Lead
// ─────────────────────────────────────────────────────────────────

async function pushViaWebToLead(lead: Lead): Promise<SalesforceResult> {
  const first = lead.firstName || splitName(lead.fullName).first;
  const last = lead.lastName || splitName(lead.fullName).last;

  const form = new URLSearchParams({
    oid: process.env.SF_WEB_TO_LEAD_OID!,
    encoding: "UTF-8",
    first_name: first,
    last_name: last || lead.fullName,
    email: lead.email,
    mobile: lead.phone,
    phone: lead.phone,
    city: lead.city,
    country: "Colombia",
    company: lead.university || "Estudiante",
    lead_source: process.env.SF_LEAD_SOURCE || "EV2 Campus",
    rating: rating(lead.tier),
    description: description(lead),
  });

  // En Web-to-Lead los campos personalizados van por su Id (00N...).
  const values = fieldValues(lead);
  for (const [key, sfField] of Object.entries(customFieldMap())) {
    if (sfField) form.set(sfField, String(values[key as LeadFieldKey]));
  }

  // Mientras se prueba, Salesforce devuelve un correo con el diagnóstico
  // de cada envío si se activa debug.
  if (process.env.SF_WEB_TO_LEAD_DEBUG_EMAIL) {
    form.set("debug", "1");
    form.set("debugEmail", process.env.SF_WEB_TO_LEAD_DEBUG_EMAIL);
  }

  const host = process.env.SF_WEB_TO_LEAD_HOST || "https://webto.salesforce.com";
  const response = await fetch(`${host}/servlet/servlet.WebToLead?encoding=UTF-8`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
    signal: AbortSignal.timeout(6000),
  });

  // Web-to-Lead responde 200 o un redirect; no devuelve el Id del lead.
  const ok = response.status >= 200 && response.status < 400;
  return ok
    ? { ok: true, mode: "web-to-lead" }
    : { ok: false, mode: "web-to-lead", error: `HTTP ${response.status}` };
}

// ─────────────────────────────────────────────────────────────────

export type SalesforceResult =
  | { ok: true; mode: "rest" | "web-to-lead"; salesforceId?: string }
  | { ok: false; mode: "rest" | "web-to-lead"; error: string }
  | { ok: false; skipped: true };

export async function pushToSalesforce(lead: Lead): Promise<SalesforceResult> {
  try {
    if (
      process.env.SF_INSTANCE_URL &&
      process.env.SF_CLIENT_ID &&
      process.env.SF_CLIENT_SECRET
    ) {
      return await pushViaRest(lead);
    }
    if (process.env.SF_WEB_TO_LEAD_OID) {
      return await pushViaWebToLead(lead);
    }
    return { ok: false, skipped: true };
  } catch (error) {
    const mode = process.env.SF_WEB_TO_LEAD_OID ? "web-to-lead" : "rest";
    console.error("[salesforce] Envío fallido:", error);
    return { ok: false, mode, error: (error as Error).message };
  }
}
