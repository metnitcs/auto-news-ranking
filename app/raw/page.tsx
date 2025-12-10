"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NewsRaw {
    id: string;
    source: string;
    source_id: string;
    title: string;
    content: string;
    created_at: string;
    meta: any;
}

export default function RawDataPage() {
    const [data, setData] = useState<NewsRaw[]>([]);
    const [filteredData, setFilteredData] = useState<NewsRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterData();
    }, [data, searchTerm, dateFilter, sourceFilter]);

    const fetchData = async () => {
        setLoading(true);
        const { data: rawNews, error } = await supabase
            .from('news_raw')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (!error && rawNews) {
            setData(rawNews);
        }
        setLoading(false);
    };

    const filterData = () => {
        let filtered = [...data];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                const diffTime = now.getTime() - itemDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (dateFilter === 'today') return diffDays < 1;
                if (dateFilter === 'week') return diffDays < 7;
                if (dateFilter === 'month') return diffDays < 30;
                return true;
            });
        }

        // Source filter
        if (sourceFilter !== 'all') {
            filtered = filtered.filter(item => item.source === sourceFilter);
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
                    <p className="text-sm text-slate-400">Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Raw Data Viewer</h1>
                    <p className="mt-2 text-slate-400">Browse and search all crawled news items</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 backdrop-blur-sm">
                    <span className="text-lg">📊</span>
                    <div className="text-sm">
                        <div className="font-medium text-white">{filteredData.length}</div>
                        <div className="text-xs text-slate-500">Total Items</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-medium text-slate-400">Search</label>
                    <input
                        type="text"
                        placeholder="Search by title or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">Date Range</label>
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">Source Type</label>
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="all">All Sources</option>
                        <option value="facebook_page">Facebook</option>
                        <option value="rss">RSS</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Source</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Content</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Engagement</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="text-4xl mb-3">🔍</div>
                                        <p className="text-slate-400">No data found</p>
                                        <p className="mt-1 text-sm text-slate-600">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => {
                                    const meta = item.meta || {};
                                    const engagement = meta.engagement || {};
                                    return (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-800/30">
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                                                <div className="text-xs">
                                                    {new Date(item.created_at).toLocaleDateString('th-TH', { 
                                                        day: 'numeric', 
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {new Date(item.created_at).toLocaleTimeString('th-TH', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.source === 'rss' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {item.source === 'rss' ? '📡' : '👥'}
                                                    {meta.source_name || item.source}
                                                </span>
                                            </td>
                                            <td className="max-w-md px-4 py-3">
                                                <div className="truncate font-medium text-slate-200">{item.title}</div>
                                                <div className="mt-1 truncate text-xs text-slate-500">{item.content}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.source === 'facebook_page' ? (
                                                    <div className="flex justify-center gap-3 text-xs">
                                                        <span className="text-slate-400" title="Likes">👍 {engagement.likes || 0}</span>
                                                        <span className="text-slate-400" title="Shares">↗️ {engagement.shares || 0}</span>
                                                        <span className="text-slate-400" title="Comments">💬 {engagement.comments || 0}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <a
                                                    href={meta.original_url || item.source_id}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                                                >
                                                    View →
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800/50 bg-slate-800/30 px-4 py-3">
                        <div className="text-sm text-slate-400">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
