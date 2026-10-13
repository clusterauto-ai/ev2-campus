# EV2 Campus — Experiencia interactiva para universitarios

App de tótem táctil para la activación del **Kia EV2** en universidades de Bogotá.
El estudiante recorre 6 pasos en ~90 segundos, ve con sus propios números qué tan
cerca está del carro, y deja sus datos como lead calificado. Al cerrar el
registro se dispara el efecto del domo (humo/luces).

Stack: **Next.js 15 · React 19 · Tailwind · Framer Motion · Firestore (opcional)**.

---

## 1. Correr en local

```bash
npm install
npm run dev
```

- Tótem: <http://localhost:3000>
- Panel de administración: <http://localhost:3000/admin> (clave por defecto `metrokia2026`)

Sin ninguna variable de entorno la app funciona completa: los leads y la
configuración se guardan en `data/*.json` dentro del proyecto.

## 2. Variables de entorno

Copia `.env.example` a `.env.local`. Todo es opcional; lo que no esté definido
cae al respaldo local.

| Variable | Para qué |
|---|---|
| `ADMIN_PASSWORD` | Clave del panel `/admin`. **Cámbiala antes del evento.** |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Cuenta de servicio de Firebase. Activa Firestore como destino principal de leads y config. |
| `SF_INSTANCE_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET` | **Salesforce vía REST API** (Connected App, client credentials). Crea el Lead y guarda su Id. |
| `SF_WEB_TO_LEAD_OID` | **Salesforce vía Web-to-Lead** (sin credenciales). Solo el OID de la org. |
| `SF_FIELD_MAP`, `SF_LEAD_SOURCE` | Mapeo opcional a campos personalizados y origen del lead. |
| `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_TOKEN` | Webhook genérico (POST JSON) si sistemas prefiere un middleware propio. Solo se usa si no hay Salesforce configurado. |
| `SMOKE_WEBHOOK_URL`, `SMOKE_WEBHOOK_TOKEN` | Endpoint del controlador del domo. Recibe `{event:"lead_completed", intensity, ...}`. |
| `NEXT_PUBLIC_EVENT_NAME`, `NEXT_PUBLIC_TOTEM_ID` | Etiquetan cada lead con el evento y el tótem que lo capturó. |

### Firestore
1. Firebase Console → Configuración del proyecto → Cuentas de servicio → *Generar nueva clave privada*.
2. Del JSON descargado copia `project_id`, `client_email` y `private_key` a las variables.
3. Colecciones que se crean solas: `leads` (un doc por lead) y `config/simulator`.

### Salesforce
Dos caminos, la app elige solo según las variables presentes (`src/lib/salesforce.ts`):

**A. REST API (producción).** Admin de Salesforce crea una *Connected App* con
OAuth + *Client Credentials Flow* asociada a un usuario de integración con
permiso de crear Leads. Se llenan `SF_INSTANCE_URL`, `SF_CLIENT_ID`,
`SF_CLIENT_SECRET`. La app hace `POST /services/data/v61.0/sobjects/Lead` y
guarda el Id devuelto en el lead (visible en `/admin` y en el CSV).

**B. Web-to-Lead (piloto).** Marketing entra a *Setup → Web-to-Lead → Create
Form*, copia el `oid` y se pone en `SF_WEB_TO_LEAD_OID`. Sin credenciales,
límite por defecto 500 leads/día. Con `SF_WEB_TO_LEAD_DEBUG_EMAIL` Salesforce
manda un correo de diagnóstico por cada envío mientras se prueba.

En ambos casos viajan los campos estándar (`FirstName`, `LastName`, `Email`,
`MobilePhone`, `City`, `Company`=universidad, `LeadSource`, `Rating`
Hot/Warm/Cold) y un `Description` con toda la simulación en texto. Si la org
crea campos personalizados, se mapean con `SF_FIELD_MAP`, por ejemplo:

```json
{"score":"EV2_Score__c","monthlyCommitment":"EV2_Cuota__c","familyGap":"EV2_Brecha__c","university":"EV2_Universidad__c"}
```

Campos sugeridos para crear en el objeto Lead: `EV2_Score__c` (Number),
`EV2_Cuota__c` (Currency), `EV2_Aporte_Estudiante__c` (Currency),
`EV2_Brecha_Familiar__c` (Currency), `EV2_Cobertura__c` (Percent),
`EV2_Universidad__c`, `EV2_Programa__c`, `EV2_Semestre__c` (Text),
`EV2_Autoriza_Datos__c`, `EV2_Autoriza_Marketing__c` (Checkbox),
`EV2_Lead_Id__c` (Text, External Id — evita duplicados si se reintenta).

## 3. Despliegue

### Opción A — Vercel (recomendada)
```bash
npx vercel
```
Configura las variables de entorno en el proyecto de Vercel. **En Vercel el
disco es de solo lectura**, así que sin Firestore los leads solo viven en
memoria del proceso: para producción define Firestore o el webhook del CRM.

### Opción B — Portátil dentro del domo (sin internet estable)
```bash
npm run build
npm start
```
Abre Chrome/Edge en modo kiosco apuntando a `http://localhost:3000`:

```bash
msedge --kiosk http://localhost:3000 --edge-kiosk-type=fullscreen --no-first-run
```

Los leads quedan en `data/leads.json` y se exportan desde `/admin` → *Exportar CSV*.
Si hay internet, además se sincronizan con Firestore/CRM.

## 4. Operación en el evento

- **Pantalla**: diseñada para tótem vertical 1080×1920. Toda la tipografía escala
  con `vh`, así que también se ve bien en tablet o celular.
- **Auto-reset**: si nadie toca la pantalla en 100 s vuelve a la pantalla de
  atracción y borra los datos de la persona anterior. Tras el registro se
  reinicia sola a los 22 s.
- **Teclado**: la app trae su propio teclado táctil; desactiva el teclado del
  sistema operativo en el kiosco.
- **Probar el humo**: en `/admin` botón *Probar humo* dispara el webhook del domo
  sin crear un lead.
- **Cambiar precios/tasas**: `/admin` → pestañas Vehículo / Financiación / Uso.
  Guarda y refresca el tótem (F5). No hace falta reiniciar nada.
- **Ver leads**: `/admin` → Leads. Filtra por tier y exporta CSV (abre directo
  en Excel en español).

## 5. Cómo se calcula

Todo está en `src/lib/finance.ts` y es parametrizable desde `/admin`.

| Concepto | Fórmula |
|---|---|
| Cuota del crédito | Sistema francés: `P·i·(1+i)^n / ((1+i)^n − 1)` con `i` = tasa mensual equivalente de la E.A. |
| Compromiso mensual | Cuota + seguro todo riesgo + cuota de manejo |
| Costo de energía | `km/mes × (kWh batería / autonomía) × precio kWh` |
| Equivalente gasolina | `km/mes ÷ km/galón × precio galón` |
| Ahorro impuesto | `precio × 1% × 60% ÷ 12` (descuento Bogotá para EV, 5 años) |
| Ahorro mantenimiento | `(mant. gasolina − mant. EV) ÷ 12` |
| **Costo real mensual** | Compromiso + energía (lo que de verdad sale del bolsillo) |
| Ahorro frente a gasolina | Combustible + impuesto + mantenimiento. **Se muestra como argumento, no se descuenta del costo**: un estudiante que hoy anda en Uber no está pagando esa gasolina. |
| Aporte del estudiante | Hábitos recortados (semanales × 52/12) + gasto actual en transporte |
| Brecha familiar | `max(0, costo real − aporte del estudiante)` |
| Cobertura | `aporte ÷ costo real` |

### Score del lead (0–100)
Cobertura (hasta 40) + mayor de edad (10) + semestre (hasta 15) + celular
válido (15) + correo válido (10) + acepta marketing (10).
`≥70` caliente · `≥45` tibio · resto frío.

### Valores por defecto y fuentes (agosto 2026)

| Dato | Valor | Fuente |
|---|---|---|
| Precio EV2 Air Colombia | $89.990.000 | [Autocosmos](https://noticias.autocosmos.com.co/2026/07/15/kia-ev2-llega-a-colombia-precio-autonomia-caracteristicas-y-equipamiento-del-nuevo-suv-electrico), [V12](https://v12magazine.com/actualidad/colombia/kia-ev2-colombia-precio-caracteristicas/) |
| Batería / autonomía / potencia | 42,2 kWh · 312 km WLTP · 145 hp | [El Carro Colombiano](https://www.elcarrocolombiano.com/lanzamientos/kia-ev2-colombia-precio-caracteristicas-suv-electrico/) |
| Tasa promedio vehículo nuevo | 18,37 % E.A. | [Coriesgos](https://coriesgos.com/blog/tasas-credito-vehicular-colombia-2026) |
| Plazo típico | 6 años concentra ~85 % de créditos | [La República](https://www.larepublica.co/finanzas/tasas-de-interes-para-financiar-la-compra-de-su-vehiculo-en-junio-estan-entre-17-2-y-24-5-4407309) |
| kWh residencial Bogotá | ~$650 | [Oasis Group](https://oasisgroup.online/cuanto-cuesta-cargar-un-carro-electrico-en-colombia-2026-promedios-por-ciudad-tipo-de-cargador-y-horario/) |
| Galón gasolina corriente | ~$16.267 | [La FM](https://www.lafm.com.co/sociedad/colombia-carros-electricos-gasolina-403732) |
| Beneficios EV (impuesto 60 % Bogotá, sin pico y placa, SOAT −10 %) | — | [Colombia.com](https://www.colombia.com/tecnologia/noticias/cuales-son-los-beneficios-para-carros-electricos-e-hibridos-en-colombia-en-2026-impuestos-y-soat-583008), [El Carro Colombiano](https://www.elcarrocolombiano.com/industria/comprar-carro-electrico-colombia-barato-beneficios-ahorro/) |

Los costos de hábitos (rumba $130k, domicilio $38k, café $14k…) son supuestos
razonables para Bogotá 2026 y están pensados para ajustarse desde `/admin`.

## 6. Estructura

```
src/
  app/
    page.tsx              ← tótem
    admin/page.tsx        ← panel
    api/leads             ← POST captura · GET listado
    api/leads/export      ← CSV
    api/config            ← GET público · POST/DELETE admin
    api/admin/login       ← cookie de sesión
    api/smoke             ← prueba manual del domo
  components/
    Experience.tsx        ← máquina de estados del flujo + auto-reset
    screens/              ← una carpeta por pantalla
    ui/                   ← teclado, stepper, número animado, shell
    admin/                ← login y panel
  lib/
    finance.ts            ← motor de cálculo, narrativa, score
    defaultConfig.ts      ← valores de fábrica
    store.ts              ← Firestore → disco → memoria
    integrations.ts       ← CRM y domo
```

## 7. Cumplimiento

- La autorización de tratamiento de datos (Ley 1581/2012) es obligatoria, no
  viene premarcada, y se guarda con cada lead. La de marketing es opcional.
- El aviso legal ("valores estimados, sujeto a aprobación de la financiera")
  aparece en las pantallas de plan, resultado y captura, y es editable.
- Ningún dato personal se guarda en el navegador del tótem: al reiniciar la
  experiencia se borra todo del estado.
