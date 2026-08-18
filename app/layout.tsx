import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/anybody/wdth.css";
import "@fontsource-variable/noto-kufi-arabic";
import "@fontsource-variable/public-sans";
import "./phoenix.css";
import LanguageController from "./components/language-controller";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "phoenixutd.com";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "Phoenix United FC | Dubai Football Club",
      template: "%s | Phoenix United FC",
    },
    description:
      "Phoenix United FC is a UAE FA licensed football club in Dubai, connecting real club football with an international player pathway.",
    applicationName: "Phoenix United FC",
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/brand/phoenix-flame.svg",
      shortcut: "/brand/phoenix-flame.svg",
      apple: "/brand/phoenix-flame.svg",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Phoenix United FC",
      title: "Phoenix United FC | Dubai Football Club",
      description:
        "A UAE FA licensed football club in Dubai, connecting real club football with an international player pathway.",
      images: [
        {
          url: "/og-share.png",
          width: 1200,
          height: 630,
          alt: "Phoenix United FC: a football club in Dubai, built to rise.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Phoenix United FC | Dubai Football Club",
      description:
        "A real football club in Dubai, connected to an international player pathway.",
      images: ["/og-share.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: "Phoenix United FC",
    url: "https://phoenixutd.com",
    sameAs: ["https://www.instagram.com/phoenix_utdfc"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
  };

  return (
    <html lang="en">
      <body>
        <LanguageController />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
        />
      </body>
    </html>
  );
}
