import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { DynamicThemeColor } from "@/components/dynamic-theme-color";

export const metadata: Metadata = {
  title: "Qwikfinx",
  description: "A simple wallet application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Qwikfinx",
  },
  icons: {
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-sidebar">
      <body className="bg-sidebar text-sidebar-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DynamicThemeColor />
          <Providers>{children}</Providers>
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
