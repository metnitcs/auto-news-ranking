import { NextResponse } from 'next/server';
import { autoPostApprovedPosts } from '@/services/autoPost';

export async function POST(request: Request) {
    try {
        const { limit = 5 } = await request.json().catch(() => ({}));

        const results = await autoPostApprovedPosts(limit);

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error: any) {
        console.error('[Manual Auto-Post] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
