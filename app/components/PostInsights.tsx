"use client";

import { useState, useEffect } from 'react';

interface PostInsightsProps {
    fbPostId: string | null;
}

interface Insights {
    reactions: number;
    comments: number;
    shares: number;
}

export function PostInsights({ fbPostId }: PostInsightsProps) {
    const [insights, setInsights] = useState<Insights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fbPostId) return;

        const fetchInsights = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/posts/insights?fb_post_id=${fbPostId}`);
                const data = await res.json();
                if (data.success) {
                    setInsights(data.insights);
                } else {
                    setError(data.error || 'Failed to load');
                }
            } catch (e) {
                setError('Failed to fetch insights');
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [fbPostId]);

    if (!fbPostId) {
        return (
            <div className="text-xs text-slate-500 italic">No Facebook data</div>
        );
    }

    if (loading) {
        return (
            <div className="flex gap-2 text-xs text-slate-500">
                <span className="animate-pulse">Loading insights...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-xs text-red-400">{error}</div>
        );
    }

    if (!insights) return null;

    return (
        <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-sm">
                <span>👍</span>
                <span className="text-slate-300 font-medium">{insights.reactions || 0}</span>
                <span className="text-slate-500 text-xs">Reactions</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
                <span>💬</span>
                <span className="text-slate-300 font-medium">{insights.comments || 0}</span>
                <span className="text-slate-500 text-xs">Comments</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
                <span>🔄</span>
                <span className="text-slate-300 font-medium">{insights.shares || 0}</span>
                <span className="text-slate-500 text-xs">Shares</span>
            </div>
        </div>
    );
}
