import { supabase } from '@/lib/supabase';
import { InteractivePostReview } from '../../components/InteractivePostReview';
import { PostedItemCard } from '../../components/PostedItemCard';

async function getApprovalData() {
  // Get all posts that are not yet posted
  const { data: draftPosts } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  const { data: approvedPosts } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const { data: postedPosts } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })
    .limit(10);

  return {
    drafts: draftPosts || [],
    approved: approvedPosts || [],
    posted: postedPosts || []
  };
}

export default async function PostApprovalPage() {
  const { drafts, approved, posted } = await getApprovalData();

  return (
    <section className="space-y-8 max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Post Management</h2>
          <p className="text-sm text-slate-400">Review, edit, and publish your posts</p>
        </div>
        <a href="/" className="text-sm text-indigo-400 hover:text-indigo-300">&larr; Back to Dashboard</a>
      </div>

      {/* Draft Posts */}
      <div>
        <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
          Pending Review ({drafts.length})
        </h3>
        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center text-slate-500">
            No drafts waiting for review
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map(post => (
              <InteractivePostReview
                key={post.id}
                post={{
                  id: post.id,
                  type: post.type,
                  content: post.content,
                  scheduled_at: post.scheduled_at
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved Posts */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
          Approved - Ready to Publish ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center text-slate-500">
            No approved posts
          </div>
        ) : (
          <div className="space-y-4">
            {approved.map(post => (
              <InteractivePostReview
                key={post.id}
                post={{
                  id: post.id,
                  type: post.type,
                  content: post.content,
                  scheduled_at: post.scheduled_at
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Posted History */}
      <div>
        <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400"></span>
          Recently Posted ({posted.length})
        </h3>
        {posted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center text-slate-500">
            No posts published yet
          </div>
        ) : (
          <div className="space-y-3">
            {posted.map(post => (
              <PostedItemCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
