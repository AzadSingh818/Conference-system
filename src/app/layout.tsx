import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APBMT 2025 Conference Management System",
  description: "Abstract submission and management system for APBMT 2025 Conference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
