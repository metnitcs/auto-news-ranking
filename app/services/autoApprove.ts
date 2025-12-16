import { supabase } from '@/lib/supabase';

export async function autoApprovePosts() {
    console.log('[Auto-Approve] Starting...');

    const { data: draftPosts, error: fetchError } = await supabase
        .from('generated_posts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: true });

    if (fetchError) {
        throw new Error(`Failed to fetch draft posts: ${fetchError.message}`);
    }

    if (!draftPosts || draftPosts.length === 0) {
        return { message: 'No draft posts to approve', approved: 0 };
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

    return {
        success: true,
        approved: draftPosts.length
    };
}
