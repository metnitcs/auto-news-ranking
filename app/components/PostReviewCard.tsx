
"use client";

import React, { useState } from 'react';

interface PostDraft {
    id: string;
    type: string;
    content: string;
    scheduled_at?: string;
}

interface PostReviewCardProps {
    post: PostDraft | null;
    loading?: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete?: (id: string) => void;
    onPublish?: (id: string) => void;
    onSave?: (id: string, newContent: string) => void;
}

export const PostReviewCard: React.FC<PostReviewCardProps> = ({ post, loading, onApprove, onReject, onDelete, onPublish, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');

    if (!post) {
        return null;
    }

    // Clean content - remove any markdown/prompt artifacts
    const cleanContent = post.content
        .replace(/```json[\s\S]*?```/gi, '')
        .replace(/```[\s\S]*?```/gi, '')
        .replace(/^[\w_]+:\s*$/gm, '')
        .replace(/^(OK!|นี่คือ|ครับ|ค่ะ).*\n/gi, '')
        .trim();

    const handleStartEdit = () => {
        setEditedContent(cleanContent);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent('');
    };

    const handleSaveEdit = () => {
        if (onSave && editedContent.trim()) {
            onSave(post.id, editedContent.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className={`rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur-md ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <h3 className="text-sm font-semibold text-indigo-400">
                        {isEditing ? 'EDITING' : 'WAITING FOR APPROVAL'}
                    </h3>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400 uppercase">
                    {post.type.replace('_', ' ')}
                </span>
            </div>

            {/* Content Area */}
            <div className="mb-4 rounded-lg bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
                <div className="mb-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">📰</div>
                    <div>
                        <div className="text-sm font-medium text-white">News Ranking Page</div>
                        <div className="text-xs text-slate-500">Just now · 🌐</div>
                    </div>
                </div>

                {isEditing ? (
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-48 bg-slate-900 text-slate-200 rounded-lg p-3 text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Edit your post content..."
                    />
                ) : (
                    <div className="whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                        {cleanContent}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {isEditing ? (
                    /* Edit Mode Buttons */
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancelEdit}
                            className="flex-1 rounded-lg border border-slate-700 bg-transparent py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-500"
                        >
                            💾 Save Changes
                        </button>
                    </div>
                ) : (
                    /* Normal Mode Buttons */
                    <>
                        {onPublish && (
                            <button
                                onClick={() => onPublish(post.id)}
                                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500"
                            >
                                🚀 Publish to Facebook NOW
                            </button>
                        )}

                        <div className="flex gap-2">
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(post.id)}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30"
                                >
                                    🗑️
                                </button>
                            )}
                            <button
                                onClick={handleStartEdit}
                                className="flex-1 rounded-lg border border-slate-700 bg-transparent py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => onApprove(post.id)}
                                className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
                            >
                                📋 Save for Later
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
