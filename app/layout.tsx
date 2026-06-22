import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAMA Analytics Dashboard",
  description: "Metricas consolidadas del sistema LAMA",
  icons: {
    icon: "/fav_icon.png",
    shortcut: "/fav_icon.png",
    apple: "/fav_icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
