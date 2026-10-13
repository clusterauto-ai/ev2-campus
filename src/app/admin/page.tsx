import { AdminPanel } from "@/components/admin/AdminPanel";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { isAuthenticated } from "@/lib/auth";
import { getConfig, isFirestoreConfigured, listLeads } from "@/lib/store";
import { isSalesforceConfigured } from "@/lib/salesforce";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    return <AdminLogin />;
  }

  const [config, leads] = await Promise.all([getConfig(), listLeads(500)]);

  return (
    <AdminPanel
      initialConfig={config}
      initialLeads={leads}
      status={{
        firestore: isFirestoreConfigured(),
        crm: isSalesforceConfigured() || Boolean(process.env.CRM_WEBHOOK_URL),
        smoke: Boolean(process.env.SMOKE_WEBHOOK_URL),
        totemId: process.env.NEXT_PUBLIC_TOTEM_ID || "DOMO-01",
      }}
    />
  );
}
