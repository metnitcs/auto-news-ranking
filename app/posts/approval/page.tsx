'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { InteractivePostReview } from '../../components/InteractivePostReview';
import { PostedItemCard } from '../../components/PostedItemCard';

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
  const itemsPerPage = 10;

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
    setLoading(false);
  };

  // Get current tab data
  const getCurrentData = () => {
    if (activeTab === 'pending') return drafts;
    if (activeTab === 'approved') return approved;
    return posted;
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentData.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when switching tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
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
        <button
          onClick={() => handleTabChange('pending')}
          className={`relative px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>⏳ Pending Review</span>
            {drafts.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                {drafts.length}
              </span>
            )}
          </div>
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          )}
        </button>
        
        <button
          onClick={() => handleTabChange('approved')}
          className={`relative px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'approved'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>✅ Ready to Publish</span>
            {approved.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                {approved.length}
              </span>
            )}
          </div>
          {activeTab === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          )}
        </button>
        
        <button
          onClick={() => handleTabChange('published')}
          className={`relative px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'published'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>🚀 Published</span>
            {posted.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                {posted.length}
              </span>
            )}
          </div>
          {activeTab === 'published' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {paginatedData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700/50 bg-slate-900/20 p-16 text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'pending' && '✅'}
              {activeTab === 'approved' && '📤'}
              {activeTab === 'published' && '💭'}
            </div>
            <p className="text-lg text-slate-400">
              {activeTab === 'pending' && 'No drafts waiting for review'}
              {activeTab === 'approved' && 'No approved posts'}
              {activeTab === 'published' && 'No posts published yet'}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {activeTab === 'pending' && 'All posts have been reviewed'}
              {activeTab === 'approved' && 'Review drafts to approve them'}
              {activeTab === 'published' && 'Start by approving and publishing drafts'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activeTab === 'published' ? (
                paginatedData.map(post => (
                  <PostedItemCard key={post.id} post={post} />
                ))
              ) : (
                paginatedData.map(post => (
                  <InteractivePostReview
                    key={post.id}
                    post={{
                      id: post.id,
                      type: post.type,
                      content: post.content,
                      image_url: post.image_url,
                      scheduled_at: post.scheduled_at
                    }}
                    onRefresh={fetchData}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/30 px-6 py-4">
                <div className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, currentData.length)} of {currentData.length} posts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
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
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
