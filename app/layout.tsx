import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GA Inventory - Perkasa Networks",
  description: "General Affair Inventory Management System",
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon.png?v=2', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico?v=2', '/favicon.png?v=2'],
    apple: [{ url: '/apple-touch-icon.png?v=2' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/favicon.png?v=2" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
