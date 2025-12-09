import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const results: any = {
        timestamp: new Date().toISOString(),
        steps: []
    };

    try {
        // Step 1: Crawl
        console.log('[Daily Cron] Step 1: Crawling...');
        const crawlRes = await fetch(`${baseUrl}/api/crawl`, { method: 'POST' });
        const crawlData = await crawlRes.json();
        results.steps.push({ step: 'crawl', ...crawlData });

        // Step 2: Summarize
        console.log('[Daily Cron] Step 2: Summarizing...');
        const sumRes = await fetch(`${baseUrl}/api/process/summarize`, { method: 'POST' });
        const sumData = await sumRes.json();
        results.steps.push({ step: 'summarize', ...sumData });

        // Step 3: Analyze
        console.log('[Daily Cron] Step 3: Analyzing...');
        const anzRes = await fetch(`${baseUrl}/api/process/analyze`, { method: 'POST' });
        const anzData = await anzRes.json();
        results.steps.push({ step: 'analyze', ...anzData });

        // Step 4: Ranking
        console.log('[Daily Cron] Step 4: Ranking...');
        const rankRes = await fetch(`${baseUrl}/api/process/ranking`, { method: 'POST' });
        const rankData = await rankRes.json();
        results.steps.push({ step: 'ranking', ...rankData });

        // Step 5: Generate Posts
        console.log('[Daily Cron] Step 5: Generating Posts...');
        const genRes = await fetch(`${baseUrl}/api/process/generate`, { method: 'POST' });
        const genData = await genRes.json();
        results.steps.push({ step: 'generate', ...genData });

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
