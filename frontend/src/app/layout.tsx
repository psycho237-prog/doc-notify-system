import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NNLOMNE Notify",
  description: "Notifications intelligentes pour les services administratifs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-[#f8fafc]`}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
