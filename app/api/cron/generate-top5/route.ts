import { NextResponse } from 'next/server';
import { runGenerator } from '@/services/generator';

export const maxDuration = 60;

export async function GET(request: Request) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Top 5 Cron] Starting generation...');
        // Only run Daily Top 5
        const result = await runGenerator(['daily_top5']);

        console.log('[Top 5 Cron] Completed:', result);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Top 5 Cron] Failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
