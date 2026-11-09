import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CommandPalette from "@/components/CommandPalette";
import { ERPProvider } from "@/lib/erp-context";

export const metadata: Metadata = {
  title: "SOTEX Garment Manufacturing ERP — سوتكس لإدارة وتصنيع الملابس",
  description: "نظام إدارة وتشغيل المصانع ومستودعات الملابس والمنسوجات المتكامل",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#202528",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-surface text-on-surface font-body-md antialiased overflow-x-hidden transition-colors duration-200">
        <ERPProvider>
          <AppShell>{children}</AppShell>
          <CommandPalette />
        </ERPProvider>
      </body>
    </html>
  );
}
