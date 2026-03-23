import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma Plateforme Familiale",
  description: "Votre espace personnel et familial tout-en-un",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
