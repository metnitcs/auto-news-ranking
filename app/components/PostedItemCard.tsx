"use client";

import { useState } from 'react';
import { PostInsights } from './PostInsights';
import Swal from 'sweetalert2';

interface PostedItemCardProps {
    post: {
        id: string;
        type: string;
        content: string;
        posted_at: string;
        payload?: {
            fb_post_id?: string;
        };
    };
}

export function PostedItemCard({ post }: PostedItemCardProps) {
    const [deleted, setDeleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const fbPostId = post.payload?.fb_post_id || null;

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Published Post?',
            text: 'This will delete the post from Facebook AND the database. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Yes, delete everywhere',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#e2e8f0'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const res = await fetch('/api/posts/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: post.id })
            });
            const data = await res.json();

            if (data.success) {
                await Swal.fire({
                    title: 'Deleted!',
                    text: data.fb_deleted
                        ? 'Post removed from Facebook and database.'
                        : 'Post removed from database.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
                setDeleted(true);
            } else {
                await Swal.fire({
                    title: 'Error',
                    text: data.error || 'Delete failed',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
            }
        } catch (e) {
            await Swal.fire({
                title: 'Error',
                text: 'Failed to delete post',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1e293b',
                color: '#e2e8f0'
            });
        } finally {
            setLoading(false);
        }
    };

    if (deleted) return null;

    return (
        <div className={`rounded-lg border border-green-900/30 bg-green-900/10 p-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-green-400 uppercase font-semibold">
                    {post.type?.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                        Posted: {post.posted_at ? new Date(post.posted_at).toLocaleString('th-TH') : 'N/A'}
                    </span>
                    <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded px-2 py-1 text-xs"
                        title="Delete from Facebook & Database"
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap mb-3">
                {post.content?.substring(0, 200)}...
            </p>

            {/* Insights Section */}
            <div className="border-t border-green-900/30 pt-3">
                <PostInsights fbPostId={fbPostId} />
            </div>
        </div>
    );
}
