import { supabase } from "@/lib/supabase";
import { DashboardStats } from "./components/DashboardStats";
import { RankingList } from "./components/RankingList";
import { PostReviewCard } from "./components/PostReviewCard";
import { InteractivePostReview } from "./components/InteractivePostReview";

// Force dynamic rendering to ensure fresh data on every load
export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Fetch Stats
  const { count: crawledCount } = await supabase.from('news_raw').select('*', { count: 'exact', head: true });
  const { count: analyzedCount } = await supabase.from('news_analysis').select('*', { count: 'exact', head: true });
  const { count: postCount } = await supabase.from('generated_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft');

  // 2. Fetch Today's Ranking
  const { data: ranking } = await supabase
    .from('news_ranking_daily')
    .select('*')
    .eq('rank_date', todayStr)
    .single();

  // 3. Reconstruct Ranking List from IDs if ranking exists
  let rankingList = [];
  if (ranking && ranking.ranked_list) {
    rankingList = ranking.ranked_list; // Assuming ranked_list structure matches RankingItem roughly or we map it
    // If ranked_list is just IDs or basic info, we might need to fetch join. 
    // PRD says: ranked_list IS jsonb. Let's assume it stores enough info for display.
    // If it stores full objects as planned in prompt engine, we are good.
  }

  // 4. Fetch ALL Pending Posts
  const { data: pendingPosts } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    stats: {
      crawled: crawledCount || 0,
      analyzed: analyzedCount || 0,
      ready: postCount || 0,
    },
    ranking: rankingList,
    pendingPosts: pendingPosts || []
  };
}

export default async function DashboardPage() {
  const { stats, ranking, pendingPosts } = await getDashboardData();
  const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Map pending posts to UI format
  const postsForReview = pendingPosts.map(post => ({
    id: post.id,
    type: post.type,
    content: post.content,
    scheduled_at: post.scheduled_at
  }));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <p>Real-time overview of Auto News system.</p>
            <span className="text-slate-600">|</span>
            <a href="/settings" className="text-indigo-400 hover:text-indigo-300 hover:underline">Manage Sources &rarr;</a>
          </div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
          📅 Today: {todayDate}
        </div>
      </div>

      {/* Stats Row */}
      <DashboardStats {...stats} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Ranking List (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-1 backdrop-blur-sm">
            <div className="p-4">
              <RankingList items={ranking} />
            </div>
          </div>
        </div>

        {/* Right Column: Post Review (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <h3 className="text-lg font-semibold text-slate-200">Pending Review ({postsForReview.length})</h3>

          {/* Show all pending posts */}
          {postsForReview.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 text-center text-slate-500">
              No posts pending review
            </div>
          ) : (
            postsForReview.map(post => (
              <InteractivePostReview key={post.id} post={post} />
            ))
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">System Logs</h4>
            <div className="space-y-2 text-xs text-slate-400 font-mono">
              <div className="flex justify-between"><span>System Ready</span><span className="text-green-500">ONLINE</span></div>
              <div className="flex justify-between"><span>DB Connection</span><span className="text-green-500">OK</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


