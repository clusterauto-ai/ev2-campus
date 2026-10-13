"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Ambient } from "../Ambient";
import { defaultSimulationInput, formatCOP, simulate } from "@/lib/finance";
import type { AppConfig, Habit, Lead } from "@/lib/types";

/**
 * Panel de administración. Es una herramienta interna, así que la
 * prioridad es que sea rápido de operar en un portátil, no que sea
 * espectacular. Comparte tokens visuales con el tótem para que se
 * sienta parte del mismo producto.
 */

type Tab = "leads" | "vehiculo" | "financiacion" | "uso" | "habitos" | "textos";

const TABS: { id: Tab; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "vehiculo", label: "Vehículo" },
  { id: "financiacion", label: "Financiación" },
  { id: "uso", label: "Uso y ahorros" },
  { id: "habitos", label: "Hábitos" },
  { id: "textos", label: "Textos" },
];

export function AdminPanel({
  initialConfig,
  initialLeads,
  status,
}: {
  initialConfig: AppConfig;
  initialLeads: Lead[];
  status: { firestore: boolean; crm: boolean; smoke: boolean; totemId: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("leads");
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Vista previa: cómo queda la cuota con la config que se está editando.
  const preview = useMemo(
    () => simulate(config, defaultSimulationInput(config)),
    [config],
  );

  const update = (patch: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3500);
  };

  const save = async () => {
    setSaving(true);
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      flash(`Error: ${data.error ?? "no se pudo guardar"}`);
      return;
    }
    setConfig(data);
    setDirty(false);
    flash("Configuración guardada. Refresca el tótem para aplicarla.");
  };

  const resetDefaults = async () => {
    if (!confirm("¿Restablecer todos los valores a los de fábrica?")) return;
    const response = await fetch("/api/config", { method: "DELETE" });
    if (response.ok) {
      setConfig(await response.json());
      setDirty(false);
      flash("Valores de fábrica restablecidos.");
    }
  };

  const refreshLeads = async () => {
    const response = await fetch("/api/leads");
    if (response.ok) {
      const data = await response.json();
      setLeads(data.leads);
      flash(`${data.leads.length} leads cargados.`);
    }
  };

  const testSmoke = async () => {
    const response = await fetch("/api/smoke", { method: "POST" });
    const data = await response.json();
    flash(data.message);
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  };

  return (
    <main className="relative min-h-screen bg-ink-950 text-fg">
      <Ambient intensity={0.35} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Encabezado */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.24em]">KIA · EV2 CAMPUS</p>
            <h1 className="mt-2 text-3xl font-light tracking-tight">
              Panel de administración
            </h1>
            <p className="mt-1 text-sm text-fg-dim">
              Tótem {status.totemId} · {leads.length} leads capturados
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill ok={status.firestore} label="Firestore" />
            <StatusPill ok={status.crm} label="Salesforce" />
            <StatusPill ok={status.smoke} label="Domo" />
            <button onClick={testSmoke} className="btn btn-ghost px-4 py-2 text-xs">
              Probar humo
            </button>
            <button onClick={logout} className="btn btn-ghost px-4 py-2 text-xs">
              Salir
            </button>
          </div>
        </header>

        {/* Vista previa de la cuota con la config actual */}
        <div className="panel mt-6 grid grid-cols-2 gap-4 p-5 md:grid-cols-4" style={{ borderRadius: "1.4rem" }}>
          <Kpi label="Precio" value={formatCOP(config.vehicle.price)} />
          <Kpi label="Cuota base" value={formatCOP(preview.monthlyCommitment)} hint={`${config.financing.defaultTerm} m · ${config.financing.defaultDownPayment}% inicial`} />
          <Kpi label="Ahorro EV / mes" value={formatCOP(preview.evSaving)} accent />
          <Kpi label="Tasa" value={`${config.financing.annualRate}% E.A.`} />
        </div>

        {/* Pestañas */}
        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-selected={tab === t.id}
              className="chip px-4 py-2 text-sm"
              style={{ borderRadius: "999px" }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="panel mt-4 p-6" style={{ borderRadius: "1.4rem" }}>
          {tab === "leads" && (
            <LeadsTab leads={leads} onRefresh={refreshLeads} />
          )}

          {tab === "vehiculo" && (
            <Grid>
              <NumberField label="Precio de venta (COP)" value={config.vehicle.price} onChange={(price) => update({ vehicle: { ...config.vehicle, price } })} />
              <TextField label="Nombre" value={config.vehicle.name} onChange={(name) => update({ vehicle: { ...config.vehicle, name } })} />
              <TextField label="Versión" value={config.vehicle.trim} onChange={(trim) => update({ vehicle: { ...config.vehicle, trim } })} />
              <NumberField label="Batería (kWh)" value={config.vehicle.batteryKwh} step={0.1} onChange={(batteryKwh) => update({ vehicle: { ...config.vehicle, batteryKwh } })} />
              <NumberField label="Autonomía WLTP (km)" value={config.vehicle.rangeKm} onChange={(rangeKm) => update({ vehicle: { ...config.vehicle, rangeKm } })} />
              <NumberField label="Potencia (hp)" value={config.vehicle.horsepower} onChange={(horsepower) => update({ vehicle: { ...config.vehicle, horsepower } })} />
              <TextField label="Tiempo de carga" value={config.vehicle.chargeTimeLabel} onChange={(chargeTimeLabel) => update({ vehicle: { ...config.vehicle, chargeTimeLabel } })} />
              <TextField label="Garantía" value={config.vehicle.warrantyLabel} onChange={(warrantyLabel) => update({ vehicle: { ...config.vehicle, warrantyLabel } })} />
            </Grid>
          )}

          {tab === "financiacion" && (
            <Grid>
              <TextField label="Financiera aliada" value={config.financing.financierName ?? ""} onChange={(financierName) => update({ financing: { ...config.financing, financierName } })} />
              <TextField label="Nota de tasa visible al usuario" value={config.financing.rateNote ?? ""} onChange={(rateNote) => update({ financing: { ...config.financing, rateNote } })} />
              <label className="block text-xs font-medium text-fg-dim">
                Plan Cuota Baja (1er año solo intereses)
                <button
                  type="button"
                  onClick={() => update({ financing: { ...config.financing, offerFirstYearInterestOnly: !config.financing.offerFirstYearInterestOnly } })}
                  data-selected={config.financing.offerFirstYearInterestOnly === true}
                  className="chip mt-1.5 block px-4 py-2.5 text-sm"
                  style={{ borderRadius: "0.8rem" }}
                >
                  {config.financing.offerFirstYearInterestOnly ? "Activo: se muestra en plan y resultado" : "Inactivo"}
                </button>
              </label>
              <NumberField label="Tasa efectiva anual (%)" value={config.financing.annualRate} step={0.01} onChange={(annualRate) => update({ financing: { ...config.financing, annualRate } })} />
              <NumberField label="Seguro todo riesgo mensual (COP)" value={config.financing.monthlyInsurance} onChange={(monthlyInsurance) => update({ financing: { ...config.financing, monthlyInsurance } })} />
              <NumberField label="Cuota de manejo mensual (COP)" value={config.financing.monthlyAdminFee} onChange={(monthlyAdminFee) => update({ financing: { ...config.financing, monthlyAdminFee } })} />
              <ListField label="Plazos en meses (separados por coma)" value={config.financing.terms} onChange={(terms) => update({ financing: { ...config.financing, terms } })} />
              <NumberField label="Plazo por defecto" value={config.financing.defaultTerm} onChange={(defaultTerm) => update({ financing: { ...config.financing, defaultTerm } })} />
              <ListField label="Opciones de cuota inicial (%)" value={config.financing.downPaymentOptions} onChange={(downPaymentOptions) => update({ financing: { ...config.financing, downPaymentOptions } })} />
              <NumberField label="Cuota inicial por defecto (%)" value={config.financing.defaultDownPayment} onChange={(defaultDownPayment) => update({ financing: { ...config.financing, defaultDownPayment } })} />
            </Grid>
          )}

          {tab === "uso" && (
            <Grid>
              <NumberField label="Km al mes del usuario tipo" value={config.usage.monthlyKm} onChange={(monthlyKm) => update({ usage: { ...config.usage, monthlyKm } })} />
              <NumberField label="Precio kWh residencial (COP)" value={config.usage.kwhPrice} onChange={(kwhPrice) => update({ usage: { ...config.usage, kwhPrice } })} />
              <NumberField label="Precio galón gasolina (COP)" value={config.usage.gasolinePricePerGallon} onChange={(gasolinePricePerGallon) => update({ usage: { ...config.usage, gasolinePricePerGallon } })} />
              <NumberField label="Rendimiento gasolina (km/galón)" value={config.usage.gasolineKmPerGallon} step={0.5} onChange={(gasolineKmPerGallon) => update({ usage: { ...config.usage, gasolineKmPerGallon } })} />
              <NumberField label="Impuesto vehicular (% valor)" value={config.usage.vehicleTaxRate} step={0.1} onChange={(vehicleTaxRate) => update({ usage: { ...config.usage, vehicleTaxRate } })} />
              <NumberField label="Descuento impuesto EV (%)" value={config.usage.vehicleTaxDiscount} onChange={(vehicleTaxDiscount) => update({ usage: { ...config.usage, vehicleTaxDiscount } })} />
              <NumberField label="Mantenimiento anual gasolina (COP)" value={config.usage.gasolineYearlyMaintenance} onChange={(gasolineYearlyMaintenance) => update({ usage: { ...config.usage, gasolineYearlyMaintenance } })} />
              <NumberField label="Mantenimiento anual EV (COP)" value={config.usage.evYearlyMaintenance} onChange={(evYearlyMaintenance) => update({ usage: { ...config.usage, evYearlyMaintenance } })} />
            </Grid>
          )}

          {tab === "habitos" && (
            <HabitsTab habits={config.habits} onChange={(habits) => update({ habits })} />
          )}

          {tab === "textos" && (
            <div className="grid gap-4">
              <TextField label="Nombre del evento" value={config.copy.eventName} onChange={(eventName) => update({ copy: { ...config.copy, eventName } })} />
              <TextField label="Título principal (usa salto de línea)" value={config.copy.heroTitle} multiline onChange={(heroTitle) => update({ copy: { ...config.copy, heroTitle } })} />
              <TextField label="Subtítulo" value={config.copy.heroSubtitle} multiline onChange={(heroSubtitle) => update({ copy: { ...config.copy, heroSubtitle } })} />
              <TextField label="Texto del botón de inicio" value={config.copy.ctaStart} onChange={(ctaStart) => update({ copy: { ...config.copy, ctaStart } })} />
              <TextField label="Mensaje de cierre" value={config.copy.closingMessage} multiline onChange={(closingMessage) => update({ copy: { ...config.copy, closingMessage } })} />
              <TextField label="Aviso legal" value={config.copy.legalNotice} multiline onChange={(legalNotice) => update({ copy: { ...config.copy, legalNotice } })} />
            </div>
          )}
        </section>

        {/* Barra de guardado */}
        {tab !== "leads" && (
          <div className="sticky bottom-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink-900/90 px-5 py-3 backdrop-blur">
            <p className="text-sm text-fg-dim">
              {dirty ? "Tienes cambios sin guardar." : "Todo guardado."}
              {config.updatedAt && (
                <span className="ml-2 text-fg-mute">
                  Última edición: {new Date(config.updatedAt).toLocaleString("es-CO")}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button onClick={resetDefaults} className="btn btn-ghost px-4 py-2 text-xs">
                Valores de fábrica
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="btn btn-primary px-5 py-2 text-sm"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line-strong bg-ink-800 px-5 py-2.5 text-sm shadow-xl">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pestaña de leads
// ─────────────────────────────────────────────────────────────────

function LeadsTab({ leads, onRefresh }: { leads: Lead[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<"todos" | Lead["tier"]>("todos");

  const visible = leads.filter((l) => filter === "todos" || l.tier === filter);
  const counts = {
    caliente: leads.filter((l) => l.tier === "caliente").length,
    tibio: leads.filter((l) => l.tier === "tibio").length,
    frio: leads.filter((l) => l.tier === "frio").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["todos", "caliente", "tibio", "frio"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              data-selected={filter === t}
              className="chip px-3 py-1.5 text-xs capitalize"
              style={{ borderRadius: "999px" }}
            >
              {t}
              {t !== "todos" && ` · ${counts[t]}`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="btn btn-ghost px-4 py-2 text-xs">
            Actualizar
          </button>
          <a href="/api/leads/export" className="btn btn-primary px-4 py-2 text-xs">
            Exportar CSV
          </a>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-fg-mute">
          Todavía no hay leads en este filtro.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-fg-mute">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Universidad</th>
                <th className="py-2 pr-4">Sem.</th>
                <th className="py-2 pr-4">Celular</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4 text-right">Cuota</th>
                <th className="py-2 pr-4 text-right">Cubre</th>
                <th className="py-2 pr-4 text-right">Score</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2">CRM</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => (
                <tr key={lead.id} className="border-t border-line">
                  <td className="py-2.5 pr-4 text-fg-mute">
                    {new Date(lead.createdAt).toLocaleString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 font-medium">{lead.fullName}</td>
                  <td className="py-2.5 pr-4 text-fg-dim">{lead.university}</td>
                  <td className="py-2.5 pr-4 text-fg-dim">{lead.semester}</td>
                  <td className="numeric py-2.5 pr-4">{lead.phone}</td>
                  <td className="py-2.5 pr-4 text-fg-dim">{lead.email}</td>
                  <td className="numeric py-2.5 pr-4 text-right">
                    {formatCOP(lead.result.monthlyCommitment)}
                  </td>
                  <td className="numeric py-2.5 pr-4 text-right">
                    {Math.round(lead.result.coveragePct)}%
                  </td>
                  <td className="numeric py-2.5 pr-4 text-right">{lead.score}</td>
                  <td className="py-2.5 pr-4">
                    <TierBadge tier={lead.tier} />
                  </td>
                  <td className="py-2.5">
                    <CrmBadge crm={lead.crm} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: Lead["tier"] }) {
  const style =
    tier === "caliente"
      ? { background: "rgba(95,225,255,.15)", color: "var(--accent-lime)" }
      : tier === "tibio"
        ? { background: "rgba(0,204,252,.14)", color: "var(--accent)" }
        : { background: "rgba(255,255,255,.07)", color: "var(--fg-dim)" };
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={style}>
      {tier}
    </span>
  );
}

function CrmBadge({ crm }: { crm: Lead["crm"] }) {
  if (!crm) {
    return <span className="text-xs text-fg-mute">—</span>;
  }
  const ok = crm.status === "enviado";
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium"
      title={ok ? `${crm.mode}${crm.salesforceId ? ` · ${crm.salesforceId}` : ""}` : crm.error}
      style={
        ok
          ? { background: "rgba(95,225,255,.15)", color: "var(--accent-lime)" }
          : { background: "rgba(255,149,120,.14)", color: "#ffb59c" }
      }
    >
      {ok ? "Salesforce ✓" : "Error"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pestaña de hábitos
// ─────────────────────────────────────────────────────────────────

function HabitsTab({
  habits,
  onChange,
}: {
  habits: Habit[];
  onChange: (habits: Habit[]) => void;
}) {
  const patch = (index: number, changes: Partial<Habit>) =>
    onChange(habits.map((h, i) => (i === index ? { ...h, ...changes } : h)));

  const add = () =>
    onChange([
      ...habits,
      {
        id: `habito-${Date.now().toString(36)}`,
        label: "Nuevo hábito",
        hint: "",
        icon: "✨",
        unitCost: 20_000,
        period: "week",
        max: 7,
        defaultCount: 0,
        active: true,
      },
    ]);

  const remove = (index: number) => onChange(habits.filter((_, i) => i !== index));

  return (
    <div>
      <p className="mb-4 text-sm text-fg-dim">
        Cada hábito es un control en la pantalla 3. Los inactivos no se muestran
        pero se conservan por si se quieren reactivar.
      </p>

      <div className="grid gap-3">
        {habits.map((habit, index) => (
          <div
            key={habit.id}
            className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 md:grid-cols-8"
            style={{ opacity: habit.active ? 1 : 0.55 }}
          >
            <TextField label="Icono" value={habit.icon} onChange={(icon) => patch(index, { icon })} />
            <div className="md:col-span-2">
              <TextField label="Nombre" value={habit.label} onChange={(label) => patch(index, { label })} />
            </div>
            <div className="md:col-span-2">
              <TextField label="Descripción corta" value={habit.hint} onChange={(hint) => patch(index, { hint })} />
            </div>
            <NumberField label="Costo c/u" value={habit.unitCost} onChange={(unitCost) => patch(index, { unitCost })} />
            <label className="block text-xs font-medium text-fg-dim">
              Período
              <select
                value={habit.period}
                onChange={(e) => patch(index, { period: e.target.value as Habit["period"] })}
                className="field mt-1.5 px-3 py-2.5 text-sm"
                style={{ borderRadius: "0.8rem" }}
              >
                <option value="week">Por semana</option>
                <option value="month">Al mes</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <NumberField label="Máx." value={habit.max} onChange={(max) => patch(index, { max })} />
              <NumberField label="Inicial" value={habit.defaultCount} onChange={(defaultCount) => patch(index, { defaultCount })} />
            </div>
            <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-8">
              <button
                onClick={() => patch(index, { active: !habit.active })}
                className="chip px-3 py-1.5 text-xs"
                data-selected={habit.active}
                style={{ borderRadius: "999px" }}
              >
                {habit.active ? "Activo" : "Inactivo"}
              </button>
              <button onClick={() => remove(index)} className="text-xs text-fg-mute hover:text-[#ffb59c]">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={add} className="btn btn-ghost mt-4 px-4 py-2 text-xs">
        + Agregar hábito
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Controles de formulario
// ─────────────────────────────────────────────────────────────────

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-fg-mute">{label}</p>
      <p className="numeric mt-1 text-xl font-light" style={{ color: accent ? "var(--accent-lime)" : "var(--fg)" }}>
        {value}
      </p>
      {hint && <p className="text-xs text-fg-mute">{hint}</p>}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-xs"
      style={{
        borderColor: ok ? "rgba(95,225,255,.4)" : "var(--line-strong)",
        color: ok ? "var(--accent-lime)" : "var(--fg-mute)",
      }}
      title={ok ? "Configurado" : "Sin configurar: usando respaldo local"}
    >
      {ok ? "●" : "○"} {label}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-fg-dim">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="field mt-1.5 px-3 py-2.5 text-sm"
          style={{ borderRadius: "0.8rem" }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field mt-1.5 px-3 py-2.5 text-sm"
          style={{ borderRadius: "0.8rem" }}
        />
      )}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="block text-xs font-medium text-fg-dim">
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="field numeric mt-1.5 px-3 py-2.5 text-sm"
        style={{ borderRadius: "0.8rem" }}
      />
    </label>
  );
}

function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));
  return (
    <label className="block text-xs font-medium text-fg-dim">
      {label}
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = e.target.value
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
          if (parsed.length > 0) onChange(parsed);
        }}
        className="field numeric mt-1.5 px-3 py-2.5 text-sm"
        style={{ borderRadius: "0.8rem" }}
      />
    </label>
  );
}
