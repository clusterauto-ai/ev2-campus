/**
 * Concesionarios Kia de Bogotá, extraídos del formulario oficial de
 * kia.com.co/cotizar (toda la red, interna y externa, sin discriminar)
 * — nombres literales, que son los que migran a SGC.
 *
 * Esta versión de la app es SOLO Bogotá (piloto en universidades);
 * para el stand de Medellín se generará otra versión.
 */

export const DEALERSHIPS: Record<string, string[]> = {
  "Bogotá": [
    "Autoland - Bogotá Sede Av. 19",
    "Autoland - Bogotá Sede Lagartos",
    "Autoniza - Bogotá Calle 80",
    "Autoniza - La Felicidad",
    "Autoniza - Toberin",
    "Jorge Cortés - Bogotá Morato",
    "Massy Motors - Bogotá Calle 146",
    "Metrokia - Av. 68",
    "Metrokia - Calle 140",
    "Metrokia - Calle 170",
    "Metrokia - Calle 224",
    "Metrokia - Cra. 36",
    "Metrokia - Madelena",
  ],
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
