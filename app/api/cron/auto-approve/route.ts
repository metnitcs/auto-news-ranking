import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Auto-Approve] Starting...');

        const { data: draftPosts, error: fetchError } = await supabase
            .from('generated_posts')
            .select('*')
            .eq('status', 'draft')
            .order('created_at', { ascending: true })
            .limit(10);

        if (fetchError) {
            throw new Error(`Failed to fetch draft posts: ${fetchError.message}`);
        }

        if (!draftPosts || draftPosts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No draft posts to approve',
                approved: 0
            });
        }

        console.log(`[Auto-Approve] Found ${draftPosts.length} draft posts`);

        const { error: updateError } = await supabase
            .from('generated_posts')
            .update({ status: 'approved' })
            .eq('status', 'draft');

        if (updateError) {
            throw new Error(`Failed to approve posts: ${updateError.message}`);
        }

        console.log(`[Auto-Approve] ✅ Approved ${draftPosts.length} posts`);

        return NextResponse.json({
            success: true,
            approved: draftPosts.length
        });

    } catch (error) {
        console.error('[Auto-Approve] Error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
