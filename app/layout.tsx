import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "./components/Navigation";

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
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Navigation />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
