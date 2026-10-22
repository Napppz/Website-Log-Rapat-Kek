import type { Metadata } from "next";
import { Public_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";

import { auth } from "@/auth";

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
  title: "Aktivitas Biro 3 | Sekretariat Dewan Nasional Kawasan Ekonomi Khusus",
  description: "Sistem Monitoring Aktivitas, Pencatatan Kegiatan & Status Pekerjaan Biro Investasi, Kerja Sama, dan Komunikasi (Biro 3) Dewan Nasional KEK.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="id" suppressHydrationWarning className={`${publicSans.variable} ${plusJakartaSans.variable}`}>
      <body suppressHydrationWarning className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#E8F5F7] selection:text-[#215865]">
        <AuthProvider session={session}>
          <ToastProvider>
            <NotificationProvider>
              <DashboardShell>{children}</DashboardShell>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
