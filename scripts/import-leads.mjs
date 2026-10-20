// Importa a Firestore los leads de un JSON (rescate / migraciones).
// node scripts/import-leads.mjs data/rescate-vercel.json
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const file = process.argv[2];
// PowerShell suele escribir UTF-8 con BOM: se quita antes de parsear.
const leads = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
const list = Array.isArray(leads) ? leads : [leads];
const db = getFirestore();

for (const lead of list) {
  await db.collection("leads").doc(lead.id).set(lead, { merge: true });
  console.log("Importado:", lead.createdAt, "|", lead.fullName, "|", lead.id);
}
console.log("Total importados:", list.length);
