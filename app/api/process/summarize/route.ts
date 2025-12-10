import { NextResponse } from 'next/server';
import { runSummarizer } from '@/services/summarizer';

export const maxDuration = 60; // 1 min timeout

export async function POST() {
    try {
        const result = await runSummarizer();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Summarizer Process Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
