import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WanQing's R2 Drive",
  description: "Personal Cloud Storage powered by Cloudflare R2",
  icons: {
    icon: "/icons/logo.png",
    shortcut: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
