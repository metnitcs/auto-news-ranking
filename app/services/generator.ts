import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';
import { generateMangaImage } from './mangaImageGenerator';

export async function runGenerator(variants: string[] = ['daily_top5', 'trending_now']) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        console.log(`[Generator] Looking for ranking for ${todayStr}`);

        const { data: ranking, error: fetchError } = await supabase
            .from('news_ranking_daily')
            .select('*')
            .eq('rank_date', todayStr)
            .single();

        if (fetchError) {
            console.error(`[Generator] Fetch error:`, fetchError);
            return { message: "No ranking found for today. Run ranking first." };
        }

        if (!ranking) {
            console.log(`[Generator] No ranking data found`);
            return { message: "No ranking found for today. Run ranking first." };
        }

        console.log(`[Generator] Found ranking with ${ranking.ranked_list?.length || 0} items`);

        const stats = { created: 0, errors: 0 };

        for (const variant of variants) {
            try {
                console.log(`\n[Generator] Processing variant: ${variant}`);
                
                let contextData = {};
                let listDetails: any[] = [];

                if (variant === 'daily_top5') {
                    if (!ranking.top5 || ranking.top5.length === 0) {
                        console.log(`[Generator] No top5 data, skipping`);
                        continue;
                    }
                    listDetails = ranking.ranked_list.filter((r: any) => ranking.top5.includes(r.id));
                    contextData = { ranked_news_detail_json: JSON.stringify(listDetails, null, 2) };
                } else if (variant === 'trending_now') {
                    if (!ranking.trending || ranking.trending.length === 0) {
                        console.log(`[Generator] No trending data, skipping`);
                        continue;
                    }
                    listDetails = ranking.ranked_list.filter((r: any) => ranking.trending.includes(r.id));
                    contextData = { trending_news_detail_json: JSON.stringify(listDetails, null, 2) };
                } else {
                    continue;
                }

                console.log(`[Generator] Generating post content...`);
                const promptConfig = getPrompt('post_generator', contextData, variant);
                const postContent = await callLLM({
                    ...promptConfig,
                    useCache: true
                });
                console.log(`[Generator] Post content generated (${postContent.length} chars)`);

                console.log(`[Generator] Generating manga comic for top headline...`);
                let imageUrl = null;
                try {
                    if (listDetails.length > 0) {
                        // สร้างการ์ตูนจาก headline ที่ 1
                        imageUrl = await generateMangaImage(listDetails[0]);
                        if (imageUrl) {
                            console.log(`[Generator] ✅ Manga comic generated: ${imageUrl}`);
                        }
                    }
                } catch (imgErr: any) {
                    console.error(`[Generator] ⚠️ Manga generation failed:`, imgErr.message);
                }

                console.log(`[Generator] Saving to database...`);
                const { error: insertError } = await supabase
                    .from('generated_posts')
                    .insert({
                        type: variant,
                        content: postContent,
                        image_url: imageUrl,
                        status: 'draft'
                    });

                if (insertError) {
                    console.error(`[Generator] Insert error:`, insertError);
                    throw insertError;
                }

                console.log(`[Generator] ✅ ${variant} post created`);
                stats.created++;

                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (err: any) {
                console.error(`[Generator] ❌ Error generating ${variant}:`, err.message);
                stats.errors++;
            }
        }

        console.log(`[Generator] Done. Created: ${stats.created}, Errors: ${stats.errors}`);
        return { success: true, stats };

    } catch (error: any) {
        console.error("[Generator] Fatal error:", error.message);
        throw error;
    }
}
