import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

// Tipografía corporativa oficial (CI Guidelines ver 2.0).
const kiaSignature = localFont({
  src: [
    { path: "../fonts/KiaSignature-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/KiaSignature-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/KiaSignature-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EV2 Campus — Tu primer carro puede ser eléctrico",
  description:
    "Experiencia interactiva Kia EV2 para universitarios. Calcula tu cuota real y descubre qué tan cerca estás del primer carro eléctrico.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#010f1d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CO" className={kiaSignature.variable}>
      <body>{children}</body>
    </html>
  );
}
