import { NextResponse } from 'next/server';
import { runCrawler } from '@/services/crawler';

export const maxDuration = 60; // 1 min timeout

export async function POST() {
    try {
        const result = await runCrawler();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Crawler failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
