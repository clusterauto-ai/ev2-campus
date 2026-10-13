import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Autenticación mínima para /admin. Un solo rol, una sola clave.
 * Suficiente para una activación de marca; si el panel llegara a
 * exponer datos sensibles a más gente, hay que migrarlo a SSO.
 */

export const ADMIN_COOKIE = "ev2_admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "metrokia2026";
}

/** Token derivado de la clave: no guardamos la clave en la cookie. */
export function adminToken(): string {
  return crypto
    .createHash("sha256")
    .update(`ev2-campus::${adminPassword()}`)
    .digest("hex");
}

/** Comparación en tiempo constante para no filtrar la clave por timing. */
export function checkPassword(candidate: string): boolean {
  const a = Buffer.from(candidate ?? "");
  const b = Buffer.from(adminPassword());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}
