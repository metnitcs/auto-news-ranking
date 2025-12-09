
"use client";

import React from 'react';

interface StatsProps {
    crawled: number;
    analyzed: number;
    ready: number;
}

export const DashboardStats: React.FC<StatsProps> = ({ crawled, analyzed, ready }) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Card 1: Crawled */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/70">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total Crawled</p>
                        <p className="mt-2 text-3xl font-bold text-sky-400">{crawled}</p>
                    </div>
                    <div className="rounded-full bg-sky-500/10 p-3 text-sky-400">
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card 2: Analyzed */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/70">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">AI Analyzed</p>
                        <p className="mt-2 text-3xl font-bold text-purple-400">{analyzed}</p>
                    </div>
                    <div className="rounded-full bg-purple-500/10 p-3 text-purple-400">
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card 3: Pending Posts */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/70">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Posts Ready</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-400">{ready}</p>
                    </div>
                    <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
