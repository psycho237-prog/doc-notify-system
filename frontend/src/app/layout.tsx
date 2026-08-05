import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NNLOMNE Notify",
  description: "Notifications intelligentes pour les services administratifs",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NNLOMNE",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-[#f8fafc]`}>
        <PwaRegister />
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
