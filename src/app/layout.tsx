import type { Metadata } from "next";
import "./globals.css";

// System font stack for reliability in build environments
const systemSans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const systemMono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const metadata: Metadata = {
  title: "Ad Operations Platform",
  description: "Advanced Meta Ads Monitoring and Performance Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: systemSans,
          "--font-geist-sans": systemSans,
          "--font-geist-mono": systemMono
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any}
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
