import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600"],
});
const text = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://planetb.example"),
  title: {
    default: "Planet B — Because There Is No Planet B",
    template: "%s · Planet B",
  },
  description:
    "The living archive of the movement Because There Is No Planet B — art that inspires environmental action. Genesis Chapter: Abuja, World Environment Day 2026.",
  openGraph: {
    title: "Planet B",
    description: "The living archive of a global movement. Because there is no Planet B.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
