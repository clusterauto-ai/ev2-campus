// Lista los leads que hay en Firestore (diagnóstico rápido).
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

const snap = await getFirestore().collection("leads").orderBy("createdAt", "desc").get();
console.log("Leads en Firestore:", snap.size);
for (const d of snap.docs) {
  const l = d.data();
  console.log("-", l.createdAt, "|", l.fullName, "|", l.phone, "|", l.dealership, "|", d.id);
}
