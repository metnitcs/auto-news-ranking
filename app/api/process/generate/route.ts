
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function POST() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Get today's ranking
        const { data: ranking, error: fetchError } = await supabase
            .from('news_ranking_daily')
            .select('*')
            .eq('rank_date', todayStr)
            .single();

        if (fetchError || !ranking) {
            return NextResponse.json({ message: "No ranking found for today. Run ranking first." });
        }

        const stats = { created: 0, errors: 0 };
        const variants = ['daily_top5', 'trending_now']; // Removed: hidden_news

        for (const variant of variants) {
            try {
                // 2. Prepare Data for Prompt
                let contextData = {};
                let newsIds = [];

                if (variant === 'daily_top5') {
                    if (!ranking.top5 || ranking.top5.length === 0) continue;
                    // Filter enriched list for top 5
                    const top5Details = ranking.ranked_list.filter((r: any) => ranking.top5.includes(r.id));
                    contextData = { ranked_news_detail_json: JSON.stringify(top5Details, null, 2) };
                    newsIds = ranking.top5;
                }
                else if (variant === 'trending_now') {
                    if (!ranking.trending || ranking.trending.length === 0) continue;
                    const trendingDetails = ranking.ranked_list.filter((r: any) => ranking.trending.includes(r.id));
                    contextData = { trending_news_detail_json: JSON.stringify(trendingDetails, null, 2) };
                    newsIds = ranking.trending;
                }
                else if (variant === 'hidden_news') {
                    if (!ranking.hidden_gems || ranking.hidden_gems.length === 0) continue;
                    const hiddenDetails = ranking.ranked_list.filter((r: any) => ranking.hidden_gems.includes(r.id));
                    contextData = { hidden_news_detail_json: JSON.stringify(hiddenDetails, null, 2) };
                    newsIds = ranking.hidden_gems;
                }

                // 3. Generate Post
                const promptConfig = getPrompt('post_generator', contextData, variant);
                const postContent = await callLLM(promptConfig);

                // 4. Save to DB
                const { error: insertError } = await supabase
                    .from('generated_posts')
                    .insert({
                        type: variant,
                        content: postContent,
                        status: 'draft'
                    });

                if (insertError) throw insertError;
                stats.created++;

                // Rate limit delay between posts
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (err) {
                console.error(`Error generating ${variant}:`, err);
                stats.errors++;
            }
        }

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Post Generator Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
