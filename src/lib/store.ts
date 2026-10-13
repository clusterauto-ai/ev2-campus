import fs from "node:fs/promises";
import path from "node:path";
import type { AppConfig, Lead } from "./types";
import { DEFAULT_CONFIG } from "./defaultConfig";

/**
 * Capa de persistencia con tres niveles de respaldo.
 *
 *   1. Firestore, si hay credenciales de cuenta de servicio.
 *   2. Archivo JSON en disco, para el piloto y para desarrollo.
 *   3. Memoria del proceso, último recurso en entornos de solo lectura.
 *
 * El objetivo operativo es simple: en el domo nunca se puede perder un
 * lead porque falló el internet. La escritura local siempre ocurre.
 */

const LEADS_COLLECTION = "leads";
const CONFIG_COLLECTION = "config";
const CONFIG_DOC = "simulator";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

const memory: { leads: Lead[]; config: AppConfig | null } = {
  leads: [],
  config: null,
};

// ─────────────────────────────────────────────────────────────────
// Firestore
// ─────────────────────────────────────────────────────────────────

type Firestore = import("firebase-admin/firestore").Firestore;

let firestorePromise: Promise<Firestore | null> | null = null;

export function isFirestoreConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

async function getFirestore(): Promise<Firestore | null> {
  if (!isFirestoreConfigured()) return null;
  if (firestorePromise) return firestorePromise;

  firestorePromise = (async () => {
    try {
      const { getApps, initializeApp, cert } = await import("firebase-admin/app");
      const { getFirestore: getDb } = await import("firebase-admin/firestore");

      const app =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Las variables de entorno guardan los saltos de línea escapados.
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        });

      return getDb(app);
    } catch (error) {
      console.error("[store] No se pudo inicializar Firestore:", error);
      return null;
    }
  })();

  return firestorePromise;
}

// ─────────────────────────────────────────────────────────────────
// Respaldo en disco
// ─────────────────────────────────────────────────────────────────

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(file: string, data: unknown): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    // Entorno de solo lectura (por ejemplo, una función serverless).
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────────────────────────

/** Rellena con los valores por defecto lo que falte en la config guardada. */
function mergeConfig(stored: Partial<AppConfig> | null): AppConfig {
  if (!stored) return DEFAULT_CONFIG;
  return {
    vehicle: { ...DEFAULT_CONFIG.vehicle, ...stored.vehicle },
    financing: { ...DEFAULT_CONFIG.financing, ...stored.financing },
    usage: { ...DEFAULT_CONFIG.usage, ...stored.usage },
    habits:
      stored.habits && stored.habits.length > 0
        ? stored.habits
        : DEFAULT_CONFIG.habits,
    copy: { ...DEFAULT_CONFIG.copy, ...stored.copy },
    updatedAt: stored.updatedAt,
  };
}

export async function getConfig(): Promise<AppConfig> {
  const db = await getFirestore();
  if (db) {
    try {
      const snap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
      if (snap.exists) return mergeConfig(snap.data() as Partial<AppConfig>);
    } catch (error) {
      console.error("[store] Lectura de config en Firestore falló:", error);
    }
  }

  if (memory.config) return memory.config;

  const fromDisk = await readJsonFile<Partial<AppConfig>>(CONFIG_FILE);
  const merged = mergeConfig(fromDisk);
  memory.config = merged;
  return merged;
}

export async function saveConfig(config: AppConfig): Promise<AppConfig> {
  const next: AppConfig = { ...config, updatedAt: new Date().toISOString() };

  memory.config = next;
  await writeJsonFile(CONFIG_FILE, next);

  const db = await getFirestore();
  if (db) {
    try {
      await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set(next);
    } catch (error) {
      console.error("[store] Escritura de config en Firestore falló:", error);
    }
  }

  return next;
}

// ─────────────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────────────

export async function saveLead(lead: Lead): Promise<{
  persisted: ("firestore" | "disk" | "memory")[];
}> {
  const persisted: ("firestore" | "disk" | "memory")[] = [];

  // Siempre en memoria primero: es lo que garantiza que la respuesta
  // al tótem sea inmediata aunque todo lo demás esté caído.
  memory.leads.unshift(lead);
  persisted.push("memory");

  const existing = (await readJsonFile<Lead[]>(LEADS_FILE)) ?? [];
  const wroteDisk = await writeJsonFile(LEADS_FILE, [lead, ...existing]);
  if (wroteDisk) persisted.push("disk");

  const db = await getFirestore();
  if (db) {
    try {
      await db.collection(LEADS_COLLECTION).doc(lead.id).set(lead);
      persisted.push("firestore");
    } catch (error) {
      console.error("[store] Escritura de lead en Firestore falló:", error);
    }
  }

  return { persisted };
}

/** Actualiza campos de un lead ya guardado (p. ej. el estado del CRM). */
export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  const apply = (lead: Lead) => (lead.id === id ? { ...lead, ...patch } : lead);

  memory.leads = memory.leads.map(apply);

  const fromDisk = await readJsonFile<Lead[]>(LEADS_FILE);
  if (fromDisk) await writeJsonFile(LEADS_FILE, fromDisk.map(apply));

  const db = await getFirestore();
  if (db) {
    try {
      await db.collection(LEADS_COLLECTION).doc(id).set(patch, { merge: true });
    } catch (error) {
      console.error("[store] Actualización de lead en Firestore falló:", error);
    }
  }
}

export async function listLeads(limit = 500): Promise<Lead[]> {
  const db = await getFirestore();
  if (db) {
    try {
      const snap = await db
        .collection(LEADS_COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      if (!snap.empty) return snap.docs.map((d) => d.data() as Lead);
    } catch (error) {
      console.error("[store] Lectura de leads en Firestore falló:", error);
    }
  }

  const fromDisk = (await readJsonFile<Lead[]>(LEADS_FILE)) ?? [];
  const merged = [...memory.leads, ...fromDisk];

  // Un mismo lead puede estar en memoria y en disco.
  const seen = new Set<string>();
  return merged
    .filter((lead) => {
      if (seen.has(lead.id)) return false;
      seen.add(lead.id);
      return true;
    })
    .slice(0, limit);
}
