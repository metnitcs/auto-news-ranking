
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function POST() {
    try {
        // 1. Get Today's Ranking
        const todayStr = new Date().toISOString().split('T')[0];

        const { data: ranking, error: rankingError } = await supabase
            .from('news_ranking_daily')
            .select('*')
            .eq('rank_date', todayStr)
            .single();

        if (rankingError || !ranking) {
            return NextResponse.json({ message: "No ranking found for today. Run /api/process/ranking first." }, { status: 404 });
        }

        const drafts = [];

        // 2. Generate Top 5 Draft
        if (ranking.top5 && ranking.top5.length > 0) {
            // Fetch details for items in Top 5 using 'in' filter
            const { data: newsItems } = await supabase
                .from('news_analysis')
                .select(`
                    id,
                    importance_score,
                    impact_score,
                    news_summary (
                        title_rewritten,
                        bullets
                    )
                `)
                .in('id', ranking.top5);

            if (newsItems) {
                // Map back to ordered list based on top5 array
                const orderedItems = ranking.top5.map((id: string) => newsItems.find((n: any) => n.id === id)).filter(Boolean);

                const promptConfig = getPrompt('post_generator', {
                    ranked_news_detail_json: JSON.stringify(orderedItems, null, 2),
                    tone_description: "น่าตื่นเต้น กระชับ ชวนติดตาม"
                }, 'daily_top5');

                const content = await callLLM(promptConfig); // Text content

                drafts.push({
                    type: 'daily_top5',
                    content: content,
                    status: 'draft',
                    created_at: new Date().toISOString()
                });
            }
        }

        // 3. Generate Trending Draft
        if (ranking.trending && ranking.trending.length > 0) {
            const { data: newsItems } = await supabase
                .from('news_analysis')
                .select(`
                    id,
                    social_trend_score,
                    news_summary (
                        title_rewritten,
                        bullets
                    )
                `)
                .in('id', ranking.trending);

            if (newsItems) {
                const promptConfig = getPrompt('post_generator', {
                    trending_news_detail_json: JSON.stringify(newsItems, null, 2),
                    tone_description: "ทันกระแส ไวรัล สนุกสนาน"
                }, 'trending_now');

                const content = await callLLM(promptConfig);

                drafts.push({
                    type: 'trending_now',
                    content: content,
                    status: 'draft',
                    created_at: new Date().toISOString()
                });
            }
        }

        // 4. Save Drafts to generated_posts
        let savedCount = 0;
        for (const draft of drafts) {
            // Check if draft of this type exists for today? (Optional logic, let's just insert for now)
            // PRD: generated_posts (id, type, payload?, content, status...)
            const { error } = await supabase
                .from('generated_posts')
                .insert({
                    type: draft.type,
                    content: draft.content,
                    status: 'draft',
                    payload: {}, // Optional metadata
                });

            if (!error) savedCount++;
            else console.error("Failed to save draft", error);
        }

        return NextResponse.json({
            success: true,
            generated: savedCount,
            drafts: drafts.map(d => ({ type: d.type }))
        });

    } catch (error) {
        console.error("Post Generator Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
