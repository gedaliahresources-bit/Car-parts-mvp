import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Openlot",
  description: "Openlot — find car parts from local yards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
