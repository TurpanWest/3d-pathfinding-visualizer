import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Game with R3F",
  description: "A React Three Fiber demo built with Next.js + Tailwind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
