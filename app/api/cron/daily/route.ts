import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: Request) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prefer APP_URL if set manually, fallback to VERCEL_URL
    const baseUrl = process.env.APP_URL
        ? process.env.APP_URL
        : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

    console.log(`[Daily Cron] Base URL: ${baseUrl}`);

    const results: any = {
        timestamp: new Date().toISOString(),
        steps: []
    };

    async function callStep(name: string, endpoint: string) {
        console.log(`[Daily Cron] Step: ${name}...`);
        try {
            const res = await fetch(`${baseUrl}${endpoint}`, { method: 'POST' });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}...`);
            }

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                results.steps.push({ step: name, ...data });
                return data;
            } else {
                const text = await res.text();
                throw new Error(`Invalid Content-Type (${contentType}): ${text.substring(0, 200)}...`);
            }
        } catch (e) {
            console.error(`[Daily Cron] Step ${name} Failed:`, e);
            throw e;
        }
    }

    try {
        // Step 1: Crawl
        await callStep('crawl', '/api/crawl');

        // Step 2: Summarize
        await callStep('summarize', '/api/process/summarize');

        // Step 3: Analyze
        await callStep('analyze', '/api/process/analyze');

        // Step 4: Ranking
        await callStep('ranking', '/api/process/ranking');

        // Step 5: Generate Posts
        await callStep('generate', '/api/process/generate');

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
