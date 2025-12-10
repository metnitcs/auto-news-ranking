import { NextResponse } from 'next/server';
import { runGenerator } from '@/services/generator';

export const maxDuration = 60;

export async function POST() {
    try {
        const result = await runGenerator();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Post Generator Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
