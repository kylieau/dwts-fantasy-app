import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { NativeAuthListener } from "@/components/native-auth-listener";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={cn(fraunces.variable, inter.variable)}>
      <body className="font-sans antialiased">
        <NativeAuthListener />
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
