import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPrompt } from '@/lib/promptEngine';
import { callLLM } from '@/lib/llm';

export const maxDuration = 60; // 1 min timeout for vercel

export async function POST() {
    try {
        // 1. Find news not yet summarized
        // We can do this by getting news_raw that doesn't have a corresponding ID in news_summary
        // Supabase JS doesn't support sophisticated NOT IN query easily in one go without raw SQL or embedding
        // Simple approach: Get recent raw news, check if in summary.
        // Or better: use a stored procedure or explicit select.
        // Let's use left join approach via Select

        // Fetch top 10 unprocessed items. 
        // Optimization: In real prod, use a status column or specific query.
        // Here we fetch raw, allowing duplicates in fetch but filtering in code for simplicity or checking existence.
        const { data: rawNews, error: fetchError } = await supabase
            .from('news_raw')
            .select('id, title, content, created_at, news_summary(id)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (fetchError || !rawNews) {
            throw new Error("Failed to fetch news_raw");
        }

        // Filter out those that already have a summary
        const pendingNews = rawNews.filter(item => !item.news_summary || (Array.isArray(item.news_summary) && item.news_summary.length === 0));

        if (pendingNews.length === 0) {
            return NextResponse.json({ message: "No pending news to summarize" });
        }

        let successCount = 0;
        let failedCount = 0;

        for (const news of pendingNews) {
            try {
                // 2. Prepare Prompt
                const promptConfig = getPrompt('summarizer', {
                    raw_content: news.content,
                    tone_description: "ภาษากลาง สุภาพ อธิบายเข้าใจง่าย ไม่ใส่อารมณ์" // Default tone
                });

                // 3. Call AI
                // Ensure json mode is active by prompt instruction, but we also pass jsonMode true to wrapper
                const responseText = await callLLM({
                    ...promptConfig,
                    jsonMode: true
                });

                // 4. Parse JSON
                // Gemini might wrap in markdown ```json ... ```, strip it
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const summaryData = JSON.parse(cleanJson);

                // 5. Save to news_summary
                const { error: insertError } = await supabase
                    .from('news_summary')
                    .insert({
                        id: news.id,
                        title_rewritten: summaryData.title,
                        bullets: summaryData.summary,
                        entities: summaryData.entities,
                        time_context: summaryData.time_context
                    });

                if (insertError) {
                    console.error(`Failed to insert summary for ${news.id}:`, insertError);
                    failedCount++;
                } else {
                    successCount++;
                }

            } catch (err) {
                console.error(`Error processing news ${news.id}:`, err);
                failedCount++;
            }
            // Rate Limit Protection
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return NextResponse.json({
            success: true,
            processed: successCount,
            failed: failedCount
        });

    } catch (error) {
        console.error("Summarizer Process Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
