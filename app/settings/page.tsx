
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
        <section className="space-y-8 max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Source Settings</h2>
                    <div className="flex gap-4">
                        <p className="text-sm text-slate-400">Manage News Sources</p>
                        <a href="/raw" className="text-sm text-indigo-400 hover:underline">🔎 View Raw Data</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleRunCrawler}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${actionLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                    >
                        {actionLoading ? 'Running...' : '⚡ Run Crawler Now'}
                    </button>
                    <button
                        onClick={handleRunProcessing}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${actionLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                    >
                        {actionLoading ? 'Processing...' : '🧠 Run AI Loop'}
                    </button>
                    <a href="/" className="text-sm text-indigo-400 hover:text-indigo-300">&larr; Back to Dashboard</a>
                </div>
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wider">🎯 Individual Steps (ประหยัด Token)</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleSingleStep('ranking')}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${actionLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-500'}`}
                    >
                        🏆 Rank Only
                    </button>
                    <button
                        onClick={() => handleSingleStep('generate')}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${actionLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-500'}`}
                    >
                        ✍️ Generate Posts Only
                    </button>
                    <p className="w-full text-xs text-slate-500 mt-2">💡 ใช้ปุ่มเหล่านี้เมื่อต้องการรันแค่ขั้นตอนเดียว ไม่ต้องรันใหม่ทั้งหมด</p>
                </div>
            </div>

            {/* Add New Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-200">Add New Source</h3>
                <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-4 items-end">
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">Type</label>
                        <select
                            className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newItem.type}
                            onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                        >
                            <option value="rss">RSS Feed</option>
                            <option value="facebook_page">Facebook Page</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">Name (Display)</label>
                        <input
                            type="text"
                            className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. ThaiPBS"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">Source ID / URL</label>
                        <input
                            type="text"
                            className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={newItem.type === 'rss' ? 'https://...' : 'Page ID'}
                            value={newItem.source_id}
                            onChange={e => setNewItem({ ...newItem, source_id: e.target.value })}
                        />
                    </div>
                    <div>
                        <button type="submit" className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            + Add Source
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-1 backdrop-blur-sm">
                <div className="p-4">
                    <h3 className="mb-4 text-lg font-semibold text-slate-200">Active Sources</h3>
                    {errorMsg && <div className="mb-4 rounded bg-red-900/50 p-3 text-sm text-red-200">Error: {errorMsg}</div>}
                    {loading ? (
                        <p className="text-slate-500">Loading...</p>
                    ) : (
                        <div className="space-y-2">
                            {sources.length === 0 && <p className="text-slate-500">No sources configured.</p>}
                            {sources.map(source => (
                                <div key={source.id} className="flex items-center justify-between rounded bg-slate-900/50 p-3 hover:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${source.type === 'rss' ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {source.type === 'facebook_page' ? 'FB Limit' : 'RSS'}
                                        </span>
                                        <div>
                                            <div className="font-medium text-slate-200">{source.name}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-md">{source.source_id}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(source.id)}
                                        className="text-xs text-red-400 hover:text-red-300 hover:underline"
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
