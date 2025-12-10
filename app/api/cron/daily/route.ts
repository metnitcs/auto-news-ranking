import { NextResponse } from 'next/server';
import { runCrawler } from '@/services/crawler';
import { runSummarizer } from '@/services/summarizer';
import { runAnalyzer } from '@/services/analyzer';
import { runRanker } from '@/services/ranker';
import { runGenerator } from '@/services/generator';

export const maxDuration = 300; // 5 mins for full process

export async function GET(request: Request) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
        timestamp: new Date().toISOString(),
        steps: []
    };

    async function runStep(name: string, fn: () => Promise<any>) {
        console.log(`[Daily Cron] Step: ${name}...`);
        try {
            const data = await fn();
            results.steps.push({ step: name, ...data });
        } catch (e) {
            console.error(`[Daily Cron] Step ${name} Failed:`, e);
            throw e;
        }
    }

    try {
        // Step 1: Crawl
        await runStep('crawl', runCrawler);

        // Step 2: Summarize
        await runStep('summarize', runSummarizer);

        // Step 3: Analyze
        await runStep('analyze', runAnalyzer);

        // Step 4: Ranking
        await runStep('ranking', runRanker);

        // Step 5: Generate Posts
        await runStep('generate', runGenerator);

        console.log('[Daily Cron] All steps completed!');
        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error('[Daily Cron] Error:', error);
        return NextResponse.json({
            success: false,
            error: String(error),
            ...results
        }, { status: 500 });
    }
}
