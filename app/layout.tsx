import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Parts Match",
  description: "Buyer search for local car-parts marketplace MVP",
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
