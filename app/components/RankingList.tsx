"use client";

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface RankingItem {
    id: string;
    rank: number;
    title: string;
    total_score: number;
    importance_score: number;
    impact_score: number;
    social_trend_score: number;
}

interface RankingListProps {
    items: RankingItem[];
}

export const RankingList: React.FC<RankingListProps> = ({ items: initialItems }) => {
    const [items, setItems] = useState(initialItems);
    const [loading, setLoading] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const router = useRouter();
    
    const displayLimit = 10;
    const displayItems = showAll ? items : items.slice(0, displayLimit);
    const hasMore = items.length > displayLimit;

    // Sync local state when props change (after router.refresh)
    React.useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const handleDelete = async (id: string, title: string) => {
        const result = await Swal.fire({
            title: 'Remove from Ranking?',
            text: `"${title.substring(0, 50)}..." will be removed from this ranking.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Yes, remove',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#e2e8f0'
        });

        if (!result.isConfirmed) return;

        setLoading(id);
        try {
            // 1. Optimistic Update
            setItems(prev => prev.filter(item => item.id !== id));

            // 2. Call API
            const res = await fetch('/api/ranking/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'delete' })
            });
            const data = await res.json();

            if (data.success) {
                // 3. Sync Server State
                router.refresh();

                await Swal.fire({
                    title: 'Removed!',
                    text: 'Item removed from ranking.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
            } else {
                // Revert optimistic update on failure
                setItems(initialItems);
                throw new Error(data.error || 'Failed to delete');
            }

        } catch (e) {
            await Swal.fire({
                title: 'Error',
                text: 'Failed to remove item',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1e293b',
                color: '#e2e8f0'
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex flex-col space-y-3">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">🏆 Today's Rankings</h3>
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        {showAll ? 'Show Less' : `View All (${items.length})`}
                    </button>
                )}
            </div>

            {!items || items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-900/20 p-8 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-sm text-slate-400">No ranking data available</p>
                    <p className="mt-1 text-xs text-slate-600">Run AI processing to generate rankings</p>
                </div>
            ) : (
                <>
                    {displayItems.map((item, index) => (
                    <div
                        key={item.id}
                        className={`group relative flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3 transition-all hover:border-slate-700 hover:bg-slate-900/80 ${loading === item.id ? 'opacity-50' : ''}`}
                    >
                        {/* Rank Badge */}
                        <div className={`flex h-8 min-w-[2rem] items-center justify-center rounded font-bold ${index + 1 === 1 ? 'bg-amber-500/20 text-amber-500' :
                            index + 1 === 2 ? 'bg-slate-400/20 text-slate-300' :
                                index + 1 === 3 ? 'bg-amber-700/20 text-amber-700' :
                                    'bg-slate-800 text-slate-500'
                            }`}>
                            #{index + 1}
                        </div>

                        <div className="flex-1">
                            <h4 className="line-clamp-2 text-sm font-medium text-slate-200 group-hover:text-white">
                                {item.title}
                            </h4>

                            <div className="mt-2 flex items-center gap-2 text-xs">
                                {/* Total Score Badge */}
                                <span className={`rounded-full px-2 py-0.5 font-bold ${item.total_score >= 80 ? 'bg-green-500/10 text-green-400' :
                                    item.total_score >= 60 ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-slate-700 text-slate-400'
                                    }`}>
                                    Score: {item.total_score}
                                </span>

                                <span className="text-slate-500">
                                    Imp: <span className="text-slate-300">{item.importance_score}</span>
                                </span>
                                <span className="text-slate-500">
                                    Impact: <span className="text-slate-300">{item.impact_score}</span>
                                </span>
                                <span className="text-slate-500">
                                    Trend: <span className="text-slate-300">{item.social_trend_score}</span>
                                </span>
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded p-1 text-sm"
                            title="Remove from ranking"
                        >
                            🗑️
                        </button>
                    </div>
                    ))}
                    
                    {hasMore && !showAll && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full rounded-lg border border-slate-700/50 bg-slate-800/30 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
                        >
                            Show {items.length - displayLimit} More Rankings
                        </button>
                    )}
                </>
            )}
        </div>
    );
};
