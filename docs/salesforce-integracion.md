# Integración EV2 Campus → Salesforce

Especificación técnica para el equipo Salesforce · Creación automática de Leads.
Versión 1.0 · Octubre 2026 · Contacto: Nicolás Esquivel (Transformación Digital).

> Copia versionada del documento `Integracion_EV2Campus_Salesforce.docx` que se envía al equipo Salesforce.

## 1. Contexto y objetivo

EV2 Campus es la aplicación de captura de leads de la campaña universitaria del Kia EV2
(https://simulacionev2.clusterauto.ai, servida en Netlify, persistencia en Firebase Firestore).
Objetivo: que cada registro cree automáticamente un Lead en Salesforce al momento del envío.
El conector ya está desarrollado en la app (`src/lib/salesforce.ts`); solo falta la configuración
del lado Salesforce descrita en la sección 3.

## 2. Arquitectura

```
Navegador → API EV2 Campus (servidor Netlify) → Firestore (persistencia)
                                └→ Salesforce REST: POST /services/data/v61.0/sobjects/Lead
```

- Autenticación: OAuth 2.0 **Client Credentials Flow** con Connected App + usuario de integración.
- Credenciales solo en variables de entorno del servidor; token renovado automáticamente (~50 min).
- Si Salesforce falla, el lead **no se pierde**: queda en Firestore con `crm.status = error` y se reprocesa.
- Alternativa ligera para piloto: **Web-to-Lead** con el OID de la org (sin credenciales). La app soporta ambas.

## 3. Lo que solicitamos al equipo Salesforce

1. **Connected App (sandbox y producción)** con OAuth Client Credentials, asociada a un usuario de
   integración con permiso de creación sobre Lead y FLS de los campos del mapeo.
   Entregables: **Instance URL (My Domain), Consumer Key, Consumer Secret**.
2. **Lista de campos OBLIGATORIOS del Lead en su org** (estándar + custom), reglas de validación
   activas y Record Type aplicable, con API names y valores válidos de cada picklist.
3. Valor de picklist **LeadSource = "EV2 Campus"**.
4. (Opcional, recomendado) Crear los **campos personalizados** de la sección 6 y devolver sus API names.
5. Confirmar política de **asignación** (Assignment Rules automáticas vía `Sforce-Auto-Assign` o no).
6. **Contacto técnico** para prueba conjunta E2E en sandbox.

## 4. Payload que envía la aplicación (campos estándar)

```json
{
  "FirstName": "Daniel Felipe",
  "LastName": "Lopez Cardenas",
  "Email": "daniel@gmail.com",
  "MobilePhone": "3232060896",
  "Phone": "3232060896",
  "City": "Bogotá",
  "Country": "Colombia",
  "Company": "Universidad Nacional",
  "LeadSource": "EV2 Campus",
  "Rating": "Hot"
}
```

- `LastName` y `Company` (obligatorios estándar) siempre van con valor; `Company` = universidad o "Estudiante".
- `Rating` llega como Hot / Warm / Cold según el score comercial (0-100) calculado por la app.
- No se envía `Description`: los datos de la simulación viajan únicamente como campos estructurados vía `SF_FIELD_MAP` (secciones 5 y 6).

## 5. Datos disponibles para mapear

Claves internas mapeables vía `SF_FIELD_MAP` (JSON `{"claveInterna": "API_Name__c"}` en variables de entorno,
sin tocar código). Los campos con * usan los mismos literales del formulario de kia.com.co/cotizar.

| Dato | Clave interna | Tipo | Ejemplo |
|---|---|---|---|
| Tipo de documento * | `documentType` | Texto/Picklist | Cédula de ciudadanía |
| Número de documento * | `documentNumber` | Texto(15) | 1012345678 |
| Concesionario * | `dealership` | Texto | Metrokia - Calle 170 |
| Universidad / Programa / Semestre | `university` / `program` / `semester` | Texto | Nacional / Ingeniería / 6 |
| Edad | `age` | Número | 21 |
| Cuota mensual simulada | `monthlyCommitment` | Moneda | 1946467 |
| Inicial / Retoma / Financiado | `downPayment` / `tradeInValue` / `financed` | Moneda | 17998000 / 0 / 71992000 |
| Plazo (meses) | `termMonths` | Número | 84 |
| Aporte estudiante / Brecha familiar | `studentCapacity` / `familyGap` | Moneda | 1384000 / 632800 |
| Cobertura (%) | `coveragePct` | Porcentaje | 69 |
| Con quién haría el crédito | `creditSupport` | Texto | Con mis papás |
| Score / Clasificación | `score` / `tier` | Número / Texto | 81 / caliente |
| Autorizaciones datos/comercial/mercadeo | `dataConsent` / `commercialConsent` / `marketingConsent` | Booleano | true |
| Evento / Tótem | `eventName` / `totemId` | Texto | Piloto Bogotá / DOMO-01 |
| Id único del lead | `leadId` | Texto(36) | uuid |

## 6. Campos personalizados sugeridos (opcional)

| API name sugerido | Tipo | Contenido |
|---|---|---|
| `Tipo_Documento__c` | Picklist | CC / CE / Pasaporte |
| `Numero_Documento__c` | Text(15) · External Id | Número de documento |
| `EV2_Concesionario__c` | Text(60) | Concesionario elegido |
| `EV2_Cuota__c` | Currency | Cuota mensual simulada |
| `EV2_Cuota_Inicial__c` / `EV2_Retoma__c` / `EV2_Financiado__c` | Currency | Estructura de la financiación |
| `EV2_Plazo_Meses__c` | Number(3,0) | Plazo |
| `EV2_Aporte_Estudiante__c` / `EV2_Brecha_Familiar__c` | Currency | Capacidad mensual y brecha |
| `EV2_Cobertura__c` | Number(3,0) | % de la cuota que cubre |
| `EV2_Apoyo_Credito__c` | Text(40) | Solo yo / Con mis papás / Suma de ingresos |
| `EV2_Score__c` | Number(3,0) | Score comercial 0-100 |
| `EV2_Universidad__c` / `EV2_Programa__c` / `EV2_Semestre__c` | Text | Perfil académico |
| `Autoriza_Datos__c` / `Autoriza_Comercial__c` / `Autoriza_Mercadeo__c` | Checkbox | Consentimientos Ley 1581 |
| `EV2_Lead_Id__c` | Text(36) · External Id único | Idempotencia: evita duplicados en reintentos |

Los nombres son sugerencias; aceptamos los que la org defina — el mapeo es configuración.

## 7. Manejo de errores, seguridad y volumen

- **Sin pérdida de datos**: ante rechazo o timeout de Salesforce, el lead persiste en Firestore con el error registrado; fallback manual vía CSV (admin → exportar) + Data Import Wizard.
- **Idempotencia**: UUID por lead; con `EV2_Lead_Id__c` como External Id los reintentos no duplican.
- **Seguridad**: secretos solo en variables de entorno de Netlify (cifradas); TLS; el navegador nunca ve tokens.
- **Volumen**: decenas de leads/día con picos en activaciones; irrelevante frente a los límites de API.

## 8. Activación del lado de la app (interno)

En Netlify → Environment variables del proyecto:

| Variable | Valor |
|---|---|
| `SF_INSTANCE_URL` | My Domain de la org (p. ej. `https://kiacolombia.my.salesforce.com`) |
| `SF_CLIENT_ID` | Consumer Key de la Connected App |
| `SF_CLIENT_SECRET` | Consumer Secret |
| `SF_FIELD_MAP` | JSON clave interna → API name (opcional) |
| `SF_API_VERSION` | opcional, por defecto `v61.0` |
| `SF_LEAD_SOURCE` | opcional, por defecto `EV2 Campus` |

Luego **Trigger deploy** y prueba E2E en sandbox. Alternativa piloto: solo `SF_WEB_TO_LEAD_OID`
(+ `SF_WEB_TO_LEAD_DEBUG_EMAIL` mientras se prueba).
