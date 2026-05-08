import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const avantGarde = localFont({
  src: [
    {
      path: "./fonts/AvantGardeForSalesforceW05-Dm.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/AvantGardeForSalesforceW05-Dm.woff",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-avant-garde",
  display: "swap",
});

export const metadata: Metadata = {
  title: "adoptify — Make Agentforce work for you",
  description: "Track your Agentforce adoption journey, learn through interactive missions, and assess your org against real readiness criteria.",
  icons: {
    icon: [{ url: "/logos/adoptify.png", type: "image/png" }],
    apple: "/logos/adoptify.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${avantGarde.variable} dark h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
