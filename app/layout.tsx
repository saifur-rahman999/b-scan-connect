import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "B-SCAN Connect",
    template: "%s | B-SCAN Connect",
  },
  description:
    "A platform connecting persons with disabilities to support, skills and inclusive opportunities in Bangladesh.",
  openGraph: {
    title: "B-SCAN Connect",
    description: "Support. Skills. Opportunities. Connected.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "B-SCAN Connect — Support. Skills. Opportunities. Connected." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "B-SCAN Connect",
    description: "Support. Skills. Opportunities. Connected.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
