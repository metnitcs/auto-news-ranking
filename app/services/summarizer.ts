import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60; // 1 min timeout

export async function runSummarizer() {
    console.log("Starting Summarizer...");
    let processedCount = 0;
    let errorCount = 0;

    // 1. Fetch un-summarized news
    // "Not in news_summary"
    const { data: rawNews, error: fetchError } = await supabase
        .from('news_raw')
        .select('*')
        // Ensure we don't re-summarize. 
        // Best way: Left join or check if ID exists in news_summary. 
        // Supabase REST doesn't support NOT IN efficiently on subquery easily.
        // For simple demo, we fetch recent raw news and filter in code or use stored procedure.
        // Or better: store "status" in news_raw? 
        // Let's assume we fetch top 20 recent news and skip if ID exists in news_summary.
        .order('created_at', { ascending: false })
        .limit(20);

    if (fetchError || !rawNews) {
        throw new Error(`Failed to fetch news_raw: ${fetchError?.message}`);
    }

    if (rawNews.length === 0) {
        return { message: "No news to summarize" };
    }

    // Check which ones are already summarized
    const rawIds = rawNews.map(n => n.id);
    const { data: existingSummaries } = await supabase
        .from('news_summary')
        .select('id')
        .in('id', rawIds);

    const existingIds = new Set(existingSummaries?.map(s => s.id) || []);
    const newsToProcess = rawNews.filter(n => !existingIds.has(n.id));

    console.log(`Found ${newsToProcess.length} news items to summarize.`);

    // 2. Process Loop
    for (const news of newsToProcess) {
        try {
            // console.log(`Summarizing: ${news.title.substring(0, 30)}...`);

            const promptConfig = getPrompt('summarizer', {
                news_content: news.content,
                news_source: news.meta?.source_name || news.source
            });

            const summaryResult = await callLLM({
                ...promptConfig,
                jsonMode: true
            });

            // Parse JSON
            let summaryJson;
            try {
                summaryJson = JSON.parse(summaryResult);
            } catch (e) {
                // Fallback for non-JSON response (rare in Gemini json_mode)
                summaryJson = {
                    summary: summaryResult,
                    title_rewritten: news.title,
                    keywords: [],
                    category: "General"
                };
            }

            // 3. Save to news_summary
            const { error: saveError } = await supabase
                .from('news_summary')
                .insert({
                    id: news.id, // One-to-one relationship
                    original_title: news.title,
                    title_rewritten: summaryJson.title_rewritten || news.title,
                    summary: summaryJson.summary,
                    category: summaryJson.category,
                    keywords: summaryJson.keywords || [],
                    key_entities: summaryJson.key_entities || []
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
