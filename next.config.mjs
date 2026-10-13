/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El tótem corre en un equipo dedicado: no queremos que el navegador
  // cachee una versión vieja de la experiencia entre jornadas de activación.
  headers: async () => [
    {
      source: "/",
      headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
    },
  ],
};

export default nextConfig;
