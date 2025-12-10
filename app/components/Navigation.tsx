"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { 
    href: '/', 
    label: 'Dashboard', 
    icon: '📊',
    description: 'Overview'
  },
  { 
    href: '/posts/approval', 
    label: 'Posts', 
    icon: '📝',
    description: 'Review & Publish'
  },
  { 
    href: '/settings', 
    label: 'Sources', 
    icon: '⚙️',
    description: 'Manage & Run AI'
  },
  { 
    href: '/raw', 
    label: 'Raw Data', 
    icon: '🗂️',
    description: 'View All News'
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="border-b border-slate-800/50 p-6">
          <Link href="/" className="block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl">
                📰
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Auto News</h1>
                <p className="text-xs text-slate-400">AI Ranking System</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}>
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-slate-800/50 p-4">
          <div className="rounded-lg bg-slate-800/30 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">System Status</span>
              <span className="flex items-center gap-1 text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                Online
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Gemini 2.0</span>
                <span className="text-slate-400">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Supabase</span>
                <span className="text-slate-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
