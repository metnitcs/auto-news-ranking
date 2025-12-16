'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TabType = 'pending' | 'approved' | 'published';

export default function PostApprovalPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [posted, setPosted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [draftsRes, approvedRes, postedRes] = await Promise.all([
      supabase.from('generated_posts').select('*').eq('status', 'draft').order('created_at', { ascending: false }),
      supabase.from('generated_posts').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('generated_posts').select('*').eq('status', 'posted').order('posted_at', { ascending: false }).limit(100)
    ]);

    setDrafts(draftsRes.data || []);
    setApproved(approvedRes.data || []);
    setPosted(postedRes.data || []);
    setSelectedIds(new Set());
    setLoading(false);
  };

  const getCurrentData = () => {
    if (activeTab === 'pending') return drafts;
    if (activeTab === 'approved') return approved;
    return posted;
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(p => p.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedIds.size} posts?`,
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete All'
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('generated_posts')
        .delete()
        .in('id', Array.from(selectedIds));

      if (!error) {
        Swal.fire('Deleted', `${selectedIds.size} posts deleted`, 'success');
        fetchData();
      }
    }
  };

  const handleApprove = async (postId: string) => {
    const { error } = await supabase
      .from('generated_posts')
      .update({ status: 'approved' })
      .eq('id', postId);

    if (!error) {
      Swal.fire('Success', 'Post approved!', 'success');
      fetchData();
    }
  };

  const handlePostToFacebook = async (postId: string) => {
    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId })
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire('Success', 'Posted to Facebook!', 'success');
        fetchData();
      } else {
        Swal.fire('Error', data.error || 'Failed to post', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to post to Facebook', 'error');
    }
  };

  const handleDelete = async (postId: string) => {
    const result = await Swal.fire({
      title: 'Delete Post?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('generated_posts')
        .delete()
        .eq('id', postId);

      if (!error) {
        Swal.fire('Deleted', 'Post deleted', 'success');
        fetchData();
      }
    }
  };

  const handleViewImage = (imageUrl: string) => {
    Swal.fire({
      imageUrl,
      imageWidth: 600,
      imageHeight: 900,
      showConfirmButton: false,
      didOpen: (modal) => {
        modal.addEventListener('click', () => Swal.close());
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-sm text-slate-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Post Management</h1>
          <p className="mt-2 text-slate-400">Review, edit, and publish your AI-generated posts</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2 backdrop-blur-sm">
          <span className="text-lg">📊</span>
          <div className="text-sm">
            <div className="font-medium text-white">{drafts.length + approved.length}</div>
            <div className="text-xs text-slate-500">Total Pending</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/50">
        {(['pending', 'approved', 'published'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>
                {tab === 'pending' && '⏳ Pending Review'}
                {tab === 'approved' && '✅ Ready to Publish'}
                {tab === 'published' && '🚀 Published'}
              </span>
              {(tab === 'pending' ? drafts.length : tab === 'approved' ? approved.length : posted.length) > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                  {tab === 'pending' ? drafts.length : tab === 'approved' ? approved.length : posted.length}
                </span>
              )}
            </div>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <span className="text-sm text-amber-200">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/50 bg-slate-900/30">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No posts found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-800/50">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Content</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Image</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((post, idx) => (
                <tr key={`post-${post.id}-${idx}`} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => handleSelectOne(post.id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400">
                      {post.type === 'daily_top5' ? 'Top 5' : 'Trending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <button
                      onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700/50"
                    >
                      {expandedId === post.id ? '📖 Hide' : '📖 Read'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {post.image_url ? (
                      <button
                        onClick={() => handleViewImage(post.image_url)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-600/30"
                      >
                        🖼️ View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="rounded-lg bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-600/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="rounded-lg bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-600/30"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <>
                          <button
                            onClick={() => handlePostToFacebook(post.id)}
                            className="rounded-lg bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-blue-600/30"
                          >
                            📱 Post
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="rounded-lg bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-600/30"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {activeTab === 'published' && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="rounded-lg bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-600/30"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.map((post, idx) => 
                expandedId === post.id ? (
                  <tr key={`expanded-${post.id}-${idx}`} className="border-b border-slate-800/50 bg-slate-800/20">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-300">📝 Full Content</h4>
                          <p className="whitespace-pre-wrap rounded-lg bg-slate-900/50 p-4 text-sm text-slate-300 leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                        {post.image_url && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-300">🖼️ Image Preview</h4>
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="max-h-96 rounded-lg border border-slate-700/50 object-cover"
                            />
                          </div>
                        )}
                        {post.metadata && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-300">📊 Metadata</h4>
                            <pre className="overflow-x-auto rounded-lg bg-slate-900/50 p-4 text-xs text-slate-400">
                              {JSON.stringify(post.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/30 px-6 py-4">
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, currentData.length)} of {currentData.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium ${
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
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
