
"use client";

import React, { useState } from 'react';
import { PostReviewCard } from './PostReviewCard';
import Swal from 'sweetalert2';

interface PostDraft {
    id: string;
    type: string;
    content: string;
    scheduled_at?: string;
}

interface InteractivePostReviewProps {
    post: PostDraft | null;
}

export const InteractivePostReview: React.FC<InteractivePostReviewProps> = ({ post }) => {
    const [hidden, setHidden] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAction = async (id: string, action: 'approve' | 'delete' | 'publish') => {
        const configs = {
            approve: {
                title: 'Save for Later?',
                text: 'This post will be saved but not published yet.',
                icon: 'question' as const,
                confirmButtonColor: '#6366f1'
            },
            delete: {
                title: 'Delete Post?',
                text: 'This action cannot be undone.',
                icon: 'warning' as const,
                confirmButtonColor: '#ef4444'
            },
            publish: {
                title: 'Publish to Facebook?',
                text: 'This post will be published immediately.',
                icon: 'question' as const,
                confirmButtonColor: '#3b82f6'
            }
        };

        const config = configs[action];
        const result = await Swal.fire({
            title: config.title,
            text: config.text,
            icon: config.icon,
            showCancelButton: true,
            confirmButtonColor: config.confirmButtonColor,
            cancelButtonColor: '#475569',
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#e2e8f0'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const endpoint = action === 'publish' ? '/api/posts/publish' : '/api/posts/action';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            const data = await res.json();

            if (data.success) {
                setHidden(true);
                if (action === 'publish') {
                    await Swal.fire({
                        title: 'Published! 🎉',
                        text: 'Your post is now live on Facebook!',
                        icon: 'success',
                        confirmButtonColor: '#22c55e',
                        background: '#1e293b',
                        color: '#e2e8f0'
                    });
                } else if (action === 'delete') {
                    await Swal.fire({
                        title: 'Deleted',
                        text: 'Post has been removed.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#1e293b',
                        color: '#e2e8f0'
                    });
                } else {
                    await Swal.fire({
                        title: 'Saved!',
                        text: 'Post saved for later.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#1e293b',
                        color: '#e2e8f0'
                    });
                }
            } else {
                await Swal.fire({
                    title: 'Error',
                    text: data.error || 'Something went wrong',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
            }
        } catch (e) {
            await Swal.fire({
                title: 'Error',
                text: 'Action failed. Please try again.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1e293b',
                color: '#e2e8f0'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id: string, newContent: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'update', content: newContent })
            });
            const data = await res.json();

            if (data.success) {
                await Swal.fire({
                    title: 'Saved! ✅',
                    text: 'Your changes have been saved.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
                window.location.reload();
            } else {
                await Swal.fire({
                    title: 'Error',
                    text: data.error || 'Failed to save',
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    background: '#1e293b',
                    color: '#e2e8f0'
                });
            }
        } catch (e) {
            await Swal.fire({
                title: 'Error',
                text: 'Save failed. Please try again.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: '#1e293b',
                color: '#e2e8f0'
            });
        } finally {
            setLoading(false);
        }
    };

    if (hidden) return null;

    return (
        <PostReviewCard
            post={post}
            loading={loading}
            onApprove={(id) => handleAction(id, 'approve')}
            onReject={(id) => handleAction(id, 'delete')}
            onDelete={(id) => handleAction(id, 'delete')}
            onPublish={(id) => handleAction(id, 'publish')}
            onSave={handleSave}
        />
    );
};
