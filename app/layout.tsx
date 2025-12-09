import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto News Ranking Dashboard",
  description: "Personal auto news ranking system"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Auto News Ranking</h1>
              <p className="text-sm text-slate-400">
                ระบบส่วนตัวสำหรับดึงข่าว · สรุป · จัดอันดับ · เตรียมโพสต์
              </p>
            </div>
            <nav className="flex gap-3 text-sm text-slate-300">
              <a href="/">แดชบอร์ด</a>
              <a href="/posts/approval">รออนุมัติ</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
