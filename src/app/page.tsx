import { Experience } from "@/components/Experience";
import { getConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Página del tótem. La configuración se lee en el servidor en cada
 * carga: cuando marketing cambia un valor en /admin, basta con
 * refrescar el tótem para que lo tome.
 */
export default async function TotemPage() {
  const config = await getConfig();
  return <Experience config={config} />;
}
