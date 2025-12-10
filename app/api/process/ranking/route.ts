import { NextResponse } from 'next/server';
import { runRanker } from '@/services/ranker';

export const maxDuration = 60;

export async function POST() {
    try {
        const result = await runRanker();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Ranking Process Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
