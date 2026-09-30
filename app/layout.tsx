import type { Metadata } from "next";
import { Public_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Log & Notula Rapat | Sekretariat Dewan Nasional Kawasan Ekonomi Khusus",
  description: "Sistem Pengelolaan Agenda Sidang, Risalah Notula & Tindak Lanjut Keputusan Rapat Sekretariat Dewan Nasional Kawasan Ekonomi Khusus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${publicSans.variable} ${plusJakartaSans.variable}`}>
      <body className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#E8F5F7] selection:text-[#215865]">
        <AuthProvider>
          <ToastProvider>
            <DashboardShell>{children}</DashboardShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
