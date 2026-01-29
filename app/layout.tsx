import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pathfinder 3D",
  description: "Turn graph theory into an adventure. Pathfinder 3D allows you to construct intricate 3D terrains and obstacles, then unleash powerful pathfinding agents to solve them. Experience the beauty of algorithmic efficiency through immersive interactive graphics.",
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
