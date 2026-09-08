import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { NativeAuthListener } from "@/components/native-auth-listener";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Mirrorball Madness",
  description: "Fantasy sports for Dancing with the Stars.",
};

// viewportFit: "cover" lets the app draw under the iPhone notch/status bar
// inside Capacitor's WKWebView (which renders edge-to-edge by default),
// which is what makes the env(safe-area-inset-*) values below non-zero.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)}>
      <body className="font-sans antialiased">
        <NativeAuthListener />
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
