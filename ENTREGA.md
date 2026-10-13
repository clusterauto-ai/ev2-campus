# EV2 Campus — Guía de entrega

App de la campaña universitaria Kia EV2 (Metrokia): tótem/web que simula la
cuota del EV2 con las condiciones de Banco Finandina y captura leads.
Next.js 15 + React 19 + Tailwind. El detalle funcional completo está en
`README.md`; esto es lo mínimo para arrancar.

## 1. Correr en local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

- App: http://localhost:3000
- Panel admin: http://localhost:3000/admin — clave por defecto `metrokia2026`
  (cámbiala con la variable `ADMIN_PASSWORD`).

Sin configurar nada más, los leads quedan en `data/leads.json` (se crea solo).

## 2. Desplegar en Netlify

> ⚠️ **No sirve el "drag & drop" de carpeta**: la app tiene backend
> (API de leads, admin, cálculo en servidor). Hay que desplegar por CLI
> o conectando un repositorio Git. El `netlify.toml` ya viene listo.

### Opción A — Netlify CLI (sin Git)

```bash
npm install -g netlify-cli
netlify login
netlify init        # crear sitio nuevo (una sola vez)
netlify deploy --build --prod
```

### Opción B — Con repositorio Git (recomendada para trabajo continuo)

1. Subir esta carpeta a un repositorio (GitHub/Azure DevOps).
2. En Netlify: **Add new site → Import an existing project** → elegir el repo.
3. Netlify lee `netlify.toml` y despliega solo. Cada push = deploy nuevo.

### Variables de entorno (Site settings → Environment variables)

Todas opcionales — la app funciona sin ellas. Ver `.env.example` para la
lista completa. Las importantes:

| Variable | Para qué |
|---|---|
| `ADMIN_PASSWORD` | Clave del panel `/admin`. **Cambiarla en producción.** |
| `FIREBASE_*` | Persistencia real de leads/config en Firestore. **En Netlify/Vercel el disco no persiste**: sin Firestore, los leads solo viven en memoria y los cambios del admin se pierden en cada deploy. Para el piloto real, configurarlo. |
| `SF_*` | Envío de cada lead a Salesforce (REST o Web-to-Lead). Ver README §2. |
| `SMOKE_WEBHOOK_URL` | Disparo del efecto de humo del domo. |

## 3. Dónde se modifica cada cosa

- **Precios, tasa Finandina, plazos, hábitos, textos**: panel `/admin`
  (no requiere tocar código). Defaults en `src/lib/defaultConfig.ts`.
- **Lógica de cálculo** (cuota, ahorro, Plan Cuota Baja): `src/lib/finance.ts`.
- **Pantallas del flujo** (7 pasos): `src/components/screens/`.
- **Diseño** (paleta Kia, glass, tipografía): `src/app/globals.css` +
  tokens de referencia en `design/design-tokens.json` (extraídos del
  guideline oficial de la agencia). Fuentes Kia Signature en `src/fonts/`.
- **Integración Salesforce**: `src/lib/salesforce.ts`.

## 4. Pendientes conocidos al momento de la entrega (oct 2026)

- Tasa Finandina configurada: 1,33% M.V. (= 17,18% E.A.), **referencia
  agosto** — confirmar tasa vigente antes de lanzar.
- Credenciales de Salesforce y de Autored (avalúo de retoma) sin asignar.
- Persistencia (Firestore o equivalente) pendiente antes del piloto.
- Formulario SGC (vitrina/concesionario) por definir e integrar.

Contacto del proyecto: Nicolás Esquivel (Transformación Digital, Metrokia).
