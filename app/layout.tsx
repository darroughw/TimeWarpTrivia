import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Archivo, Archivo_Black, Space_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./styles/globals.scss";

const paperFont = Archivo({
  subsets: ["latin"],
  variable: "--font-paper",
  display: "swap",
});

const headFont = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TimeWarp Trivia",
  description: "A decade-hopping trivia game show, built for the big screen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${paperFont.variable} ${headFont.variable} ${monoFont.variable}`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
