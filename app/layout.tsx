import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Libre_Baskerville,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-detail",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://farewell-card-seven.vercel.app/"),
  title: "NSS MEC – Farewell 2026",
  description: "Open the envelope to view your invitation.",
  openGraph: {
    title: "NSS MEC – Farewell 2026",
    description: "Open the envelope to view your invitation.",
    url: "https://farewell-card-seven.vercel.app/",
    siteName: "NSS MEC Farewell",
    images: [
      {
        url: "/preview-og.jpg",
        width: 1200,
        height: 630,
        alt: "NSS MEC Farewell Invitation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSS MEC – Farewell 2026",
    description: "Open the envelope to view your invitation.",
    images: ["/preview-og.jpg"],
  },
  icons: {
    icon: "/nss-logo.png",
    shortcut: "/nss-logo.png",
    apple: "/nss-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${cormorant.variable} ${libreBaskerville.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
