import { NextResponse } from 'next/server';
import { runAnalyzer } from '@/services/analyzer';

export const maxDuration = 60;

export async function POST() {
    try {
        const result = await runAnalyzer();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Analyzer Process Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
