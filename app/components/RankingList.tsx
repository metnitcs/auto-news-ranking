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
    // We use props directly for rendering to ensure router.refresh() updates the list.
    // Local state is only needed for optimistic updates if desired, 
    // but here we can just rely on props + loading state for simplicity or use both.
    // Let's use local state for immediate feedback + router.refresh for persistence sync.
    const [items, setItems] = useState(initialItems);
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

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
            <h3 className="mb-2 text-lg font-semibold text-slate-200">🏆 Daily Top 5</h3>

            {!items || items.length === 0 ? (
                <p className="text-sm text-slate-500">No ranking data available for today.</p>
            ) : (
                items.map((item, index) => (
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
                ))
            )}
        </div>
    );
};
