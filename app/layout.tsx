import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Auto News Ranking Dashboard",
  description: "AI-powered news ranking system"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
