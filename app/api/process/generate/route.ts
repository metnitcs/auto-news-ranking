import { NextResponse } from 'next/server';
import { runGenerator } from '@/app/services/generator';

export const maxDuration = 60;

export async function POST() {
    try {
        console.log('[API] POST /api/process/generate called');
        const result = await runGenerator();
        console.log('[API] Generator result:', result);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[API] Post Generator Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
