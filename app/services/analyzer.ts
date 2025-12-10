import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function runAnalyzer() {
    try {
        // 1. Find summaries not yet analyzed
        // Strategy: Manual Anti-Join to avoid Supabase Relationship issues
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

        // FORCE RUN ON ALL FETCHED SUMMARIES (as per original logic)
        const pendingAnalysis = summaries;

        if (pendingAnalysis.length === 0) {
            return { message: "No pending news to analyze" };
        }

        // 1.5 Fetch Meta manually (Robustness fix)
        const { data: rawData } = await supabase
            .from('news_raw')
            .select('id, meta')
            .in('id', pendingAnalysis.map(s => s.id));

        const metaMap = new Map();
        if (rawData) {
            rawData.forEach((r: any) => metaMap.set(r.id, r.meta));
        }

        let successCount = 0;
        let failedCount = 0;

        for (const item of pendingAnalysis) {
            try {
                // Prepare normalized JSON for the prompt
                const normalizedJson = JSON.stringify({
                    title: item.title_rewritten,
                    summary: item.bullets,
                    entities: item.entities,
                    time_context: item.time_context
                }, null, 2);

                // Extract metrics from manual map
                const rawMeta = metaMap.get(item.id) || {};
                const engagement = rawMeta.engagement || {};
                const metricsJson = JSON.stringify(engagement, null, 2);

                // 2. Prepare Prompt
                const promptConfig = getPrompt('analyzer', {
                    normalized_news_json: normalizedJson,
                    metrics_json: metricsJson
                });

                // 3. Call AI
                const responseText = await callLLM({
                    ...promptConfig,
                    jsonMode: true
                });

                // Debug: Log raw response to see what AI returned
                console.log(`[Analyzer Debug] Response for ${item.id}:`, responseText);

                const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                let analysisData;
                try {
                    analysisData = JSON.parse(cleanJson);
                } catch (e) {
                    console.error(`[Analyzer Error] JSON Parse Failed: ${e}`);
                    failedCount++;
                    continue; // Skip to next item
                }

                // 4. Save to news_analysis
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
        throw error; // Re-throw to be handled by caller
    }
}
