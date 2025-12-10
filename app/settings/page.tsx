
"use client";

import React, { useEffect, useState } from 'react';

interface Source {
    id: string;
    type: 'rss' | 'facebook_page';
    name: string;
    source_id: string;
    created_at: string;
}

export default function SettingsPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ type: 'rss', name: '', source_id: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [status, setStatus] = useState('');
    // "loadingSources" referenced in original code seems to be "loading" here.
    // I will map it or just use "loading".
    // Let's redefine loading to be clearer for sources vs actions.
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch('/api/config/sources');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);

            if (data.sources) setSources(data.sources);
        } catch (err) {
            console.error(err);
            setErrorMsg(String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.source_id) return;

        const res = await fetch('/api/config/sources', {
            method: 'POST',
            body: JSON.stringify(newItem),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setNewItem({ type: 'rss', name: '', source_id: '' });
            fetchSources();
        } else {
            alert('Failed to add source');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this source?')) return;
        const res = await fetch(`/api/config/sources?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchSources();
    };

    const handleRunCrawler = async () => {
        setActionLoading(true);
        setStatus("Running Crawler (Apify + RSS)...");
        try {
            const res = await fetch('/api/crawl', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setStatus(`✅ Crawler Done! Inserted: ${data.summary.inserted}, Skipped: ${data.summary.skipped}`);
                fetchSources();
            } else {
                setStatus(`❌ Crawler Error: ${data.error}`);
            }
        } catch (e) {
            setStatus("❌ Failed to run crawler");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRunProcessing = async () => {
        setActionLoading(true);
        setStatus('');
        try {
            // 1. Summarize
            setStatus("Step 1/4: Summarizing News...");
            const sumRes = await fetch('/api/process/summarize', { method: 'POST' });
            const sumData = await sumRes.json();
            if (!sumData.success && !sumData.message) throw new Error(sumData.error || "Summarize failed");

            // 2. Analyze
            setStatus(`Step 2/4: Analyzing (${sumData.processed || 0} items)...`);
            const anzRes = await fetch('/api/process/analyze', { method: 'POST' });
            const anzData = await anzRes.json();
            if (!anzData.success && !anzData.message) throw new Error(anzData.error || "Analyze failed");

            // 3. Rank
            setStatus("Step 3/4: Ranking Top 5...");
            const rankRes = await fetch('/api/process/ranking', { method: 'POST' });
            const rankData = await rankRes.json();
            if (!rankData.success && !rankData.message) throw new Error(rankData.error || "Ranking failed");

            // 4. Generate Posts
            setStatus("Step 4/4: Generating Drafts...");
            const genRes = await fetch('/api/process/generate', { method: 'POST' });
            const genData = await genRes.json();
            if (!genData.success) throw new Error(genData.error || "Post Generation failed");

            setStatus(`✅ Done! Created ${genData.stats.created} drafts.`);

        } catch (e: any) {
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSingleStep = async (step: 'ranking' | 'generate') => {
        setActionLoading(true);
        setStatus('');
        try {
            if (step === 'ranking') {
                setStatus("🏆 Running Ranking...");
                const res = await fetch('/api/process/ranking', { method: 'POST' });
                const data = await res.json();
                if (!data.success && !data.message) throw new Error(data.error || "Ranking failed");
                setStatus(`✅ Ranking Done!`);
            } else if (step === 'generate') {
                setStatus("✍️ Generating Posts...");
                const res = await fetch('/api/process/generate', { method: 'POST' });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || "Generate failed");
                setStatus(`✅ Generated ${data.stats.created} drafts!`);
            }
        } catch (e: any) {
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm">Loading settings...</p>
            </div>
        </div>
    );

    return (
        <section className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Sources & AI Control</h1>
                    <p className="mt-2 text-slate-400">Manage news sources and run AI processing pipeline</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid gap-4 md:grid-cols-2">
                <button
                    onClick={handleRunCrawler}
                    disabled={actionLoading}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${actionLoading ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' : 'border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'}`}
                >
                    <div className="relative z-10">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
                                🕷️
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Run Crawler</h3>
                                <p className="text-xs text-slate-400">Fetch latest news</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300">
                            {actionLoading ? 'Crawling in progress...' : 'Pull news from Facebook Pages & RSS feeds'}
                        </p>
                    </div>
                </button>

                <button
                    onClick={handleRunProcessing}
                    disabled={actionLoading}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${actionLoading ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' : 'border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-900/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10'}`}
                >
                    <div className="relative z-10">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-2xl">
                                🧠
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Run AI Pipeline</h3>
                                <p className="text-xs text-slate-400">Full processing</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300">
                            {actionLoading ? 'AI processing...' : 'Summarize → Analyze → Rank → Generate'}
                        </p>
                    </div>
                </button>
            </div>

            {/* Processing Status Overlay */}
            {actionLoading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <h3 className="text-lg font-semibold text-white">AI Processing</h3>
                        </div>
                        <p className="text-slate-300 text-sm">{status || 'Starting...'}</p>
                        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">This may take 1-2 minutes. Please wait...</p>
                    </div>
                </div>
            )}

            {/* Status Message (when not loading) */}
            {!actionLoading && status && (
                <div className={`rounded-lg p-4 text-sm ${status.includes('✅') ? 'bg-green-900/30 text-green-300 border border-green-800' : status.includes('❌') ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                    {status}
                </div>
            )}

            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h3 className="text-lg font-semibold text-white">Individual Steps</h3>
                    <span className="ml-auto rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
                        Save Tokens
                    </span>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                    Run specific steps without processing the entire pipeline
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        onClick={() => handleSingleStep('ranking')}
                        disabled={actionLoading}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${actionLoading ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/20'}`}
                    >
                        <span className="text-2xl">🏆</span>
                        <div>
                            <div className="font-medium text-white">Rank Only</div>
                            <div className="text-xs text-slate-400">Calculate rankings</div>
                        </div>
                    </button>
                    <button
                        onClick={() => handleSingleStep('generate')}
                        disabled={actionLoading}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${actionLoading ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' : 'border-pink-500/30 bg-pink-500/10 hover:border-pink-500/50 hover:bg-pink-500/20'}`}
                    >
                        <span className="text-2xl">✍️</span>
                        <div>
                            <div className="font-medium text-white">Generate Posts</div>
                            <div className="text-xs text-slate-400">Create drafts only</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Add New Form */}
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-xl">➕</span>
                    <h3 className="text-lg font-semibold text-white">Add New Source</h3>
                </div>
                <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-4 items-end">
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">Type</label>
                        <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={newItem.type}
                            onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                        >
                            <option value="rss">RSS Feed</option>
                            <option value="facebook_page">Facebook Page</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">Name</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="e.g. ThaiPBS"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">Source URL</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder={newItem.type === 'rss' ? 'https://...' : 'https://facebook.com/...'}
                            value={newItem.source_id}
                            onChange={e => setNewItem({ ...newItem, source_id: e.target.value })}
                        />
                    </div>
                    <div>
                        <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
                            + Add Source
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <h3 className="text-lg font-semibold text-white">Active Sources</h3>
                    </div>
                    <span className="text-sm text-slate-500">{sources.length} sources</span>
                </div>
                <div>
                    {errorMsg && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-300">Error: {errorMsg}</div>}
                    {loading ? (
                        <p className="text-slate-500">Loading...</p>
                    ) : (
                        <div className="space-y-3">
                            {sources.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-900/20 p-8 text-center">
                                    <div className="text-4xl mb-3">📦</div>
                                    <p className="text-sm text-slate-500">No sources configured yet</p>
                                </div>
                            )}
                            {sources.map(source => (
                                <div key={source.id} className="group flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-800/30 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${source.type === 'rss' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {source.type === 'facebook_page' ? '👥' : '📡'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{source.name}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${source.type === 'rss' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {source.type === 'facebook_page' ? 'Facebook' : 'RSS'}
                                                </span>
                                            </div>
                                            <div className="mt-1 max-w-md truncate text-xs text-slate-500">{source.source_id}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(source.id)}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 opacity-0 transition-all hover:bg-red-500/10 group-hover:opacity-100"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
