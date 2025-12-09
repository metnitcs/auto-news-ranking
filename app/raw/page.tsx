
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function RawDataPage() {
    // Fetch latest 50 raw items
    const { data: rawNews, error } = await supabase
        .from('news_raw')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return <div className="p-8 text-red-500">Error loading data: {error.message}</div>;
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Raw Data Viewer</h2>
                    <p className="text-sm text-slate-400">Verifying latest crawled items ({rawNews?.length || 0})</p>
                </div>
                <a href="/settings" className="text-indigo-400 hover:text-indigo-300 hover:underline">&larr; Back to Settings</a>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800/50 text-xs uppercase text-slate-200">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Content Preview</th>
                                <th className="px-4 py-3 text-center">Engagement (Meta)</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {!rawNews || rawNews.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No data found in news_raw table.
                                    </td>
                                </tr>
                            ) : (
                                rawNews.map((item) => {
                                    const meta = item.meta as any || {};
                                    const engagement = meta.engagement || {};
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {new Date(item.created_at).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.source === 'rss' ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                    {meta.source_name || item.source}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 max-w-md truncate">
                                                <div className="font-medium text-slate-200 truncate">{item.title}</div>
                                                <div className="text-xs text-slate-500 truncate">{item.content}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-xs">
                                                {item.source === 'facebook_page' ? (
                                                    <div className="flex justify-center gap-3">
                                                        <span title="Likes">👍 {engagement.likes || 0}</span>
                                                        <span title="Shares">↗️ {engagement.shares || 0}</span>
                                                        <span title="Comments">💬 {engagement.comments || 0}</span>
                                                    </div>
                                                ) : (
                                                    <span className="opacity-30">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <a
                                                    href={meta.original_url || item.source_id}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-300"
                                                >
                                                    View
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
