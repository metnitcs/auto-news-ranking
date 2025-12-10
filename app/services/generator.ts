import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';
import { generateInfographic } from './imageGenerator';

export async function runGenerator(variants: string[] = ['daily_top5', 'trending_now']) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Get today's ranking
        const { data: ranking, error: fetchError } = await supabase
            .from('news_ranking_daily')
            .select('*')
            .eq('rank_date', todayStr)
            .single();

        if (fetchError || !ranking) {
            return { message: "No ranking found for today. Run ranking first." };
        }

        const stats = { created: 0, errors: 0 };

        for (const variant of variants) {
            try {
                // 2. Prepare Data for Prompt
                let contextData = {};
                let newsIds = [];
                let listDetails: any[] = [];

                if (variant === 'daily_top5') {
                    if (!ranking.top5 || ranking.top5.length === 0) continue;
                    listDetails = ranking.ranked_list.filter((r: any) => ranking.top5.includes(r.id));
                    contextData = { ranked_news_detail_json: JSON.stringify(listDetails, null, 2) };
                    newsIds = ranking.top5;
                }
                else if (variant === 'trending_now') {
                    if (!ranking.trending || ranking.trending.length === 0) continue;
                    listDetails = ranking.ranked_list.filter((r: any) => ranking.trending.includes(r.id));
                    contextData = { trending_news_detail_json: JSON.stringify(listDetails, null, 2) };
                    newsIds = ranking.trending;
                }

                // 3. Generate Post (Text)
                const promptConfig = getPrompt('post_generator', contextData, variant);
                const postContent = await callLLM(promptConfig);

                // 3.5 Generate Infographic (Image)
                let imageUrl = null;
                if ((variant === 'daily_top5' || variant === 'trending_now') && listDetails.length > 0) {
                    imageUrl = await generateInfographic(variant as any, listDetails);
                }

                // 4. Save to DB
                // Ensure image_url column exists in Supabase first!
                const { error: insertError } = await supabase
                    .from('generated_posts')
                    .insert({
                        type: variant,
                        content: postContent,
                        image_url: imageUrl,
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

        return {
            success: true,
            stats
        };

    } catch (error) {
        console.error("Post Generator Failed:", error);
        throw error;
    }
}
