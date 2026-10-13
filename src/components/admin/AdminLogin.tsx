"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Ambient } from "../Ambient";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      setError("Clave incorrecta.");
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-ink-950 px-6">
      <Ambient intensity={0.6} />
      <form
        onSubmit={submit}
        className="panel relative z-10 w-full max-w-sm p-8"
        style={{ borderRadius: "1.6rem" }}
      >
        <p className="text-sm font-bold tracking-[0.24em]">KIA</p>
        <h1 className="mt-4 text-2xl font-light tracking-tight">
          Panel EV2 Campus
        </h1>
        <p className="mt-1 text-sm text-fg-dim">
          Acceso para marketing y financiera.
        </p>

        <label className="mt-6 block text-xs font-medium text-fg-dim">
          Clave de administrador
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="field mt-2 px-4 py-3 text-base"
            style={{ borderRadius: "0.9rem" }}
          />
        </label>

        {error && <p className="mt-3 text-sm text-[#ffb59c]">{error}</p>}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="btn btn-primary mt-6 w-full py-3 text-sm"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
