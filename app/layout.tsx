import type { Metadata } from "next";
import { Public_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthProvider } from "@/components/providers/auth-provider";

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
  title: "SIM-RAPAT KEK RI | Sistem Manajemen Rapat & Tindak Lanjut",
  description: "Sistem Manajemen Rapat & Tindak Lanjut Kawasan Ekonomi Khusus (KEK) Republik Indonesia. Sinergi 5 biro kerja dan akselerasi investasi strategis nasional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${publicSans.variable} ${plusJakartaSans.variable}`}>
      <body className="bg-[#FAFAFA] text-slate-800 antialiased selection:bg-amber-100 selection:text-amber-900">
        <AuthProvider>
          <DashboardShell>{children}</DashboardShell>
        </AuthProvider>
      </body>
    </html>
  );
}
