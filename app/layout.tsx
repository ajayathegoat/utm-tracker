import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UTM Manager — GA4 Campaign Tracker",
  description: "Shared UTM link builder and campaign tracker for marketing teams. GA4-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
