import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60;

export async function runSummarizer() {
    console.log("Starting Summarizer...");
    let processedCount = 0;
    let errorCount = 0;

    const { data: rawNews, error: fetchError } = await supabase
        .from('news_raw')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (fetchError || !rawNews) {
        throw new Error(`Failed to fetch news_raw: ${fetchError?.message}`);
    }

    if (rawNews.length === 0) {
        return { message: "No news to summarize" };
    }

    const rawIds = rawNews.map(n => n.id);
    const { data: existingSummaries } = await supabase
        .from('news_summary')
        .select('id')
        .in('id', rawIds);

    const existingIds = new Set(existingSummaries?.map(s => s.id) || []);
    const newsToProcess = rawNews.filter(n => !existingIds.has(n.id));

    console.log(`Found ${newsToProcess.length} news items to summarize.`);

    for (const news of newsToProcess) {
        try {
            const promptConfig = getPrompt('summarizer', {
                raw_content: news.content
            });

            const summaryResult = await callLLM({
                ...promptConfig,
                jsonMode: true,
                useCache: true
            });

            let summaryJson;
            try {
                summaryJson = JSON.parse(summaryResult);
            } catch (e) {
                summaryJson = {
                    title: news.title,
                    summary: [summaryResult],
                    entities: [],
                    time_context: "",
                    source_note: ""
                };
            }

            const { error: saveError } = await supabase
                .from('news_summary')
                .insert({
                    id: news.id,
                    title_rewritten: summaryJson.title || news.title,
                    entities: summaryJson.entities || [],
                    bullets: summaryJson.summary || []
                });

            if (saveError) {
                console.error(`Failed to save summary for ${news.id}:`, saveError);
                errorCount++;
            } else {
                processedCount++;
            }

        } catch (itemError) {
            console.error(`Error processing item ${news.id}:`, itemError);
            errorCount++;
        }
    }

    return {
        success: true,
        summary: {
            processed: processedCount,
            errors: errorCount,
            total_checked: rawNews.length
        }
    };
}
