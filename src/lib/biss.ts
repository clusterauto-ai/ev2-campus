import type { Lead } from "./types";

/**
 * Formato BISS/SGC: el CSV con el que se cargan los leads al SGC.
 * Columnas y valores calcados del archivo "BISS_AUDITORIA_LEADS" y del
 * "Diccionario_transformacion_Empresas_agencias": EMPRESA y AGENCIA van
 * en columnas independientes, con los literales exactos del diccionario.
 */

/** Concesionario de la app (literal de kia.com.co) → EMPRESA | AGENCIA del diccionario SGC. */
const SGC_MAP: Record<string, { empresa: string; agencia: string }> = {
  "Autoland - Bogotá Sede Av. 19": { empresa: "AUTOLAND", agencia: "AUTOLAND - BOGOTÁ SEDE AV. 19" },
  "Autoland - Bogotá Sede Lagartos": { empresa: "AUTOLAND", agencia: "AUTOLAND - BOGOTÁ SEDE LAGARTOS" },
  "Autoniza - Bogotá Calle 80": { empresa: "AUTONIZA S.A.", agencia: "AUTONIZA CALLE 80" },
  "Autoniza - La Felicidad": { empresa: "AUTONIZA S.A.", agencia: "AUTONIZA LA FELICIDAD" },
  "Autoniza - Toberin": { empresa: "AUTONIZA S.A.", agencia: "AUTONIZA TOBERIN" },
  "Jorge Cortés - Bogotá Morato": {
    empresa: "JORGE CORTES Y CIA SAS DISTRIBUIDORA DE VEHICULOS",
    agencia: "JORGE CORTÉS KIA MORATO",
  },
  "Massy Motors - Bogotá Calle 146": { empresa: "MASSY MOTORS BOGOTA SAS", agencia: "MASSY MOTORS KIA" },
  "Metrokia - Av. 68": { empresa: "METROKIA SA", agencia: "VITRINA AV 68" },
  // En kia.com.co la sede figura como "Calle 140"; en el diccionario SGC es "VITRINA CALLE 142".
  "Metrokia - Calle 140": { empresa: "METROKIA SA", agencia: "VITRINA CALLE 142" },
  "Metrokia - Calle 170": { empresa: "METROKIA SA", agencia: "VITRINA CALLE 170" },
  "Metrokia - Calle 224": { empresa: "METROKIA SA", agencia: "VITRINA CALLE 224" },
  "Metrokia - Cra. 36": { empresa: "METROKIA SA", agencia: "VITRINA CRA 36" },
  "Metrokia - Madelena": { empresa: "METROKIA SA", agencia: "VITRINA MADELENA" },
};

const DOC_MAP: Record<string, string> = {
  "Cédula de ciudadanía": "CEDULA DE CIUDADANIA",
  "Cédula de extranjería": "CEDULA DE EXTRANJERIA",
  Pasaporte: "PASAPORTE",
};

export const BISS_COLUMNS = [
  "FECHA",
  "TIPO INTERESADO",
  "MODELO",
  "EMPRESA",
  "AGENCIA",
  "IDENTIFICACION",
  "NOMBRES",
  "APELLIDOS",
  "TELEFONO",
  "EMAIL",
  "FUENTE",
  "TIPO PRODUCTO",
  "LINEA DE NEGOCIO",
  "RED COMERCIAL",
  "PAIS",
  "TIPO DOCUMENTO",
  "TIPO PERSONA",
  "RAZÓN SOCIAL",
  "NÚMERO ORDEN",
  "USUARIO",
] as const;

/** Fecha del lead en hora de Colombia (UTC-5), formato YYYY-MM-DD. */
function bogotaDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function bissRow(lead: Lead): (string | number)[] {
  const sgc = SGC_MAP[lead.dealership ?? ""] ?? { empresa: "", agencia: "" };
  return [
    bogotaDate(lead.createdAt),
    "UNLOCK EV2",
    "EV2",
    sgc.empresa,
    sgc.agencia,
    lead.documentNumber ?? "",
    lead.firstName || lead.fullName,
    lead.lastName ?? "",
    lead.phone,
    lead.email,
    "Web",
    "VEHICULO LIVIANO",
    "NUEVO",
    "KIA",
    "COLOMBIA",
    DOC_MAP[lead.documentType ?? ""] ?? "",
    "NATURAL",
    sgc.empresa,
    "",
    "EV2 Campus",
  ];
}
