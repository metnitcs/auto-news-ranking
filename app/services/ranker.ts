import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function runRanker() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: analyzedNews, error: fetchError } = await supabase
            .from('news_analysis')
            .select('id, importance_score, impact_score, social_trend_score, urgency_score, category, insight')
            .gte('created_at', startOfDay.toISOString());

        if (fetchError) {
            throw new Error(`Failed to fetch news_analysis: ${fetchError.message}`);
        }

        if (!analyzedNews || analyzedNews.length === 0) {
            return { message: "No analyzed news found for today" };
        }

        const analysisIds = analyzedNews.map(a => a.id);
        const { data: summaries } = await supabase
            .from('news_summary')
            .select('id, title_rewritten')
            .in('id', analysisIds);

        const summaryMap = new Map();
        if (summaries) {
            summaries.forEach((s: any) => summaryMap.set(s.id, s.title_rewritten));
        }

        const sanitize = (text: string) => {
            if (!text) return '';
            return text
                .replace(/["\\\n\r\t]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const itemsToRank = analyzedNews.slice(0, 100).map(item => ({
            id: item.id,
            title: sanitize(summaryMap.get(item.id) || "Untitled News"),
            scores: {
                importance: item.importance_score,
                impact: item.impact_score,
                trend: item.social_trend_score
            },
            insight: sanitize(item.insight || '')
        }));

        const promptConfig = getPrompt('ranker', {
            news_items_with_scores_json: JSON.stringify(itemsToRank, null, 2)
        });

        const responseText = await callLLM({
            ...promptConfig,
            jsonMode: true,
            useCache: true
        });

        let cleanJson = responseText.trim();
        const jsonBlockMatch = cleanJson.match(/```json\s*([\s\S]*?)\s*```/i) || cleanJson.match(/```\s*([\s\S]*?)\s*```/i);
        if (jsonBlockMatch) {
            cleanJson = jsonBlockMatch[1].trim();
        } else {
            cleanJson = cleanJson.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        let rankingResult;
        try {
            rankingResult = JSON.parse(cleanJson);
        } catch (e: any) {
            console.error("Failed to parse JSON:", e.message);
            throw new Error(`JSON Parse Error: ${e.message}`);
        }

        const enrichedRankedList = rankingResult.ranked.map((rankedItem: any) => {
            const original = itemsToRank.find(i => i.id === rankedItem.id);
            return {
                ...rankedItem,
                title: original?.title || "Unknown Title",
                importance_score: original?.scores.importance || 0,
                insight: original?.insight || ""
            };
        });

        const { error: saveError } = await supabase
            .from('news_ranking_daily')
            .upsert({
                rank_date: todayStr,
                ranked_list: enrichedRankedList,
                top5: rankingResult.top5_ids,
                trending: rankingResult.trending_ids,
                hidden_gems: rankingResult.hidden_gem_ids
            }, { onConflict: 'rank_date' });

        if (saveError) {
            throw new Error(`Failed to save ranking: ${saveError.message}`);
        }

        return {
            success: true,
            date: todayStr,
            ranked_count: enrichedRankedList.length,
            top5: rankingResult.top5_ids
        };

    } catch (error) {
        console.error("Ranking Process Failed:", error);
        throw error;
    }
}
