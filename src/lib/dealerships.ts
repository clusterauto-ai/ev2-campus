/**
 * Ciudades y concesionarios Metrokia, tomados del formulario oficial
 * de cotización de metrokia.co (los mismos valores que migran a SGC).
 * Compartido entre el front (chips) y la API (validación del lead).
 */

export const DEALERSHIPS: Record<string, string[]> = {
  "Bogotá": [
    "Metrokia - Calle 140",
    "Metrokia - Calle 170",
    "Metrokia - Calle 224",
    "Metrokia - Av. 68",
    "Metrokia - Madelena",
    "Metrokia - Cra. 36",
  ],
  "Medellín": ["Metrokia - Envigado"],
  "Villavicencio": ["Metrokia - Villavicencio"],
};

export const CITIES = Object.keys(DEALERSHIPS);

export const DOCUMENT_TYPES = [
  "Cédula de ciudadanía",
  "Cédula de extranjería",
  "Pasaporte",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Valida el número según el tipo de documento. */
export function isValidDocument(type: string, number: string): boolean {
  const value = (number || "").trim();
  if (type === "Pasaporte") return /^[A-Za-z0-9]{5,15}$/.test(value);
  return /^\d{6,12}$/.test(value);
}
