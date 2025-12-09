import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, action, content } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
        }

        if (action === 'update') {
            // Update post content
            if (!content) {
                return NextResponse.json({ error: 'Missing content for update' }, { status: 400 });
            }
            const { error } = await supabase
                .from('generated_posts')
                .update({ content })
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, updated: true });
        }

        if (action === 'delete') {
            // Delete the post
            const { error } = await supabase
                .from('generated_posts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, deleted: true });
        }

        if (action === 'approve') {
            const { error } = await supabase
                .from('generated_posts')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, status: 'approved' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error("Post Action Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

