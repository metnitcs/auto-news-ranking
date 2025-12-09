import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
        }

        // 1. Get the post from DB to get fb_post_id
        const { data: post, error: fetchError } = await supabase
            .from('generated_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const fbPostId = post.payload?.fb_post_id;

        // 2. Delete from Facebook if we have fb_post_id
        if (fbPostId && FB_PAGE_ACCESS_TOKEN) {
            try {
                const fbUrl = `https://graph.facebook.com/v18.0/${fbPostId}?access_token=${FB_PAGE_ACCESS_TOKEN}`;
                const fbResponse = await fetch(fbUrl, { method: 'DELETE' });
                const fbData = await fbResponse.json();

                if (!fbResponse.ok) {
                    console.error('Facebook Delete Error:', fbData);
                    // Continue to delete from DB even if FB delete fails
                }
            } catch (fbError) {
                console.error('Facebook API Error:', fbError);
                // Continue to delete from DB
            }
        }

        // 3. Delete from Database
        const { error: deleteError } = await supabase
            .from('generated_posts')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({
            success: true,
            message: 'Post deleted from Facebook and database',
            fb_deleted: !!fbPostId
        });

    } catch (error) {
        console.error("Delete Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
