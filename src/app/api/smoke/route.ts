import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { triggerSmoke } from "@/lib/integrations";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Disparo manual del efecto del domo. Sirve para que el equipo de
 * producción pruebe el humo y las luces antes de abrir al público,
 * sin tener que registrar un lead falso.
 */
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const probe = {
    id: "prueba-manual",
    createdAt: new Date().toISOString(),
    totemId: process.env.NEXT_PUBLIC_TOTEM_ID || "DOMO-01",
    tier: "caliente",
  } as Lead;

  const result = await triggerSmoke(probe);

  if ("skipped" in result && result.skipped) {
    return NextResponse.json({
      ok: false,
      message:
        "No hay SMOKE_WEBHOOK_URL configurada. Define la variable de entorno para conectar el controlador del domo.",
    });
  }

  const detail =
    "error" in result && result.error
      ? result.error
      : "status" in result
        ? String(result.status)
        : "sin respuesta";

  return NextResponse.json({
    ok: result.ok,
    message: result.ok
      ? "Efecto disparado correctamente."
      : `El controlador no respondió: ${detail}`,
  });
}
