import { NextResponse } from "next/server";

import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let password = "";
  try {
    password = String(((await request.json()) as { password?: string }).password ?? "");
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  // `secure` solo si la petición llegó por HTTPS: en el domo el panel se
  // puede abrir por http://IP-local desde otro equipo de la red.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    forwardedProto === "https" || new URL(request.url).protocol === "https:";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

/** Cierre de sesión. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
