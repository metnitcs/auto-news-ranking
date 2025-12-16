import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function runAnalyzer() {
    try {
        const { data: summaries, error: fetchError } = await supabase
            .from('news_summary')
            .select('id, title_rewritten, bullets, entities, time_context')
            .order('created_at', { ascending: false })
            .limit(50);

        if (fetchError || !summaries) {
            throw new Error(`Failed to fetch news_summary: ${fetchError?.message}`);
        }

        if (summaries.length === 0) {
            return { message: "No summaries found" };
        }

        const { data: rawData } = await supabase
            .from('news_raw')
            .select('id, meta')
            .in('id', summaries.map(s => s.id));

        const metaMap = new Map();
        if (rawData) {
            rawData.forEach((r: any) => metaMap.set(r.id, r.meta));
        }

        let successCount = 0;
        let failedCount = 0;

        for (const item of summaries) {
            try {
                const normalizedJson = JSON.stringify({
                    title: item.title_rewritten,
                    summary: item.bullets,
                    entities: item.entities,
                    time_context: item.time_context
                }, null, 2);

                const rawMeta = metaMap.get(item.id) || {};
                const engagement = rawMeta.engagement || {};
                const metricsJson = JSON.stringify(engagement, null, 2);

                const promptConfig = getPrompt('analyzer', {
                    normalized_news_json: normalizedJson,
                    metrics_json: metricsJson
                });

                const responseText = await callLLM({
                    ...promptConfig,
                    jsonMode: true,
                    useCache: true
                });

                const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                let analysisData;
                try {
                    analysisData = JSON.parse(cleanJson);
                } catch (e) {
                    console.error(`[Analyzer Error] JSON Parse Failed: ${e}`);
                    failedCount++;
                    continue;
                }

                const { error: insertError } = await supabase
                    .from('news_analysis')
                    .upsert({
                        id: item.id,
                        importance_score: analysisData.importance_score || 5,
                        impact_score: analysisData.impact_score || 5,
                        social_trend_score: analysisData.social_trend_score || 5,
                        urgency_score: analysisData.urgency_score || 5,
                        risk_of_misunderstanding: analysisData.risk_of_misunderstanding || 5,
                        category: analysisData.category || "General",
                        insight: analysisData.short_insight || "No insight provided"
                    });

                if (insertError) {
                    console.error(`Failed to insert analysis for ${item.id}:`, insertError);
                    failedCount++;
                } else {
                    successCount++;
                }

            } catch (err) {
                console.error(`Error analyzing news ${item.id}:`, err);
                failedCount++;
            }
        }

        return {
            success: true,
            processed: successCount,
            failed: failedCount
        };

    } catch (error) {
        console.error("Analyzer Process Failed:", error);
        throw error;
    }
}
