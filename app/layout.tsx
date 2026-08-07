import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

const description =
  "Decade-hopping party trivia. Host on the big screen, everyone else plays from their phone.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.timewarptrivia.com"),
  title: "TimeWarp Trivia",
  description,
  openGraph: {
    title: "TimeWarp Trivia",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TimeWarp Trivia",
    description,
  },
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
        <SpeedInsights />
      </body>
    </html>
  );
}
