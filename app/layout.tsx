import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./polyfills";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { ToolTracker } from "@/components/tool-tracker";
import { LastPageTracker } from "@/components/last-page-tracker";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "DevToolbox - Privacy-First Developer Tools",
    template: "%s | DevToolbox",
  },
  description:
    "Free, privacy-first developer toolkit. JSON editor, JWT decoder, Base64 encoder, UUID generator, regex validator, and 30+ tools. 100% client-side, no data leaves your browser.",
  keywords: [
    "developer tools",
    "JSON editor",
    "JWT decoder",
    "Base64 encoder",
    "UUID generator",
    "regex validator",
    "privacy tools",
    "client-side tools",
    "web developer utilities",
    "offline developer tools",
  ],
  authors: [{ name: "Marko Zanoski", url: "https://zanoski.com/me" }],
  creator: "Marko Zanoski",
  manifest: "/manifest.json",
  metadataBase: new URL("https://devtoolbox.co"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "DevToolbox",
    title: "DevToolbox - Privacy-First Developer Tools",
    description:
      "Free, privacy-first developer toolkit with 30+ tools. JSON, JWT, Base64, UUID, regex, and more. 100% client-side processing.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "DevToolbox logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DevToolbox - Privacy-First Developer Tools",
    description:
      "Free, privacy-first developer toolkit with 30+ tools. 100% client-side processing.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevToolbox",
  },
  category: "developer tools",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DevToolbox" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ToolTracker />
        <LastPageTracker />
        <PWAUpdatePrompt />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        <div className="flex min-h-dvh flex-col">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <DesktopNav />
            <main id="main-content" className="flex-1 overflow-y-auto pb-20 lg:pb-0" tabIndex={-1}>
              {children}
            </main>
          </div>
          <BottomNav />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "DevToolbox",
              description:
                "Free, privacy-first developer toolkit with 30+ tools. JSON, JWT, Base64, UUID, regex, and more. 100% client-side processing.",
              url: "https://devtoolbox.co",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Marko Zanoski",
                url: "https://zanoski.com/me",
              },
              browserRequirements: "Requires JavaScript. Works offline after first load.",
            }),
          }}
        />
      </body>
    </html>
  );
}
