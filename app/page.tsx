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
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-slate-400">Real-time overview of your AI news ranking system</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 backdrop-blur-sm">
          <span className="text-lg">📅</span>
          <div className="text-sm">
            <div className="font-medium text-white">{todayDate}</div>
            <div className="text-xs text-slate-500">Today</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <DashboardStats {...stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Ranking List (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Today's Rankings</h2>
            <span className="text-sm text-slate-500">{ranking.length} items</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
            <div className="p-6">
              <RankingList items={ranking} />
            </div>
          </div>
        </div>

        {/* Right Column: Post Review (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Pending Posts</h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
              {postsForReview.length}
            </span>
          </div>

          {/* Show all pending posts */}
          {postsForReview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/50 bg-slate-900/20 p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm text-slate-500">No posts pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postsForReview.map(post => (
                <InteractivePostReview key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* System Status Card */}
          <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span className="text-base">⚡</span>
              System Status
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">AI Engine</span>
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Database</span>
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Crawler</span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                  Idle
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


