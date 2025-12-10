import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
        }

        if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
            return NextResponse.json({
                error: 'Facebook credentials not configured. Please set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN in .env.local'
            }, { status: 500 });
        }

        // 1. Fetch the post from DB
        const { data: post, error: fetchError } = await supabase
            .from('generated_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.status === 'posted') {
            return NextResponse.json({ error: 'Post already published' }, { status: 400 });
        }

        // 2. Publish to Facebook Graph API
        let fbData;
        
        if (post.image_url) {
            // Post with photo
            const fbUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`;
            const fbResponse = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: post.image_url,
                    caption: post.content,
                    access_token: FB_PAGE_ACCESS_TOKEN
                })
            });
            fbData = await fbResponse.json();
            if (!fbResponse.ok) {
                console.error('Facebook API Error:', fbData);
                return NextResponse.json({
                    error: `Facebook Error: ${fbData.error?.message || 'Unknown error'}`,
                    details: fbData.error
                }, { status: 500 });
            }
        } else {
            // Text-only post
            const fbUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`;
            const fbResponse = await fetch(fbUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: post.content,
                    access_token: FB_PAGE_ACCESS_TOKEN
                })
            });
            fbData = await fbResponse.json();
            if (!fbResponse.ok) {
                console.error('Facebook API Error:', fbData);
                return NextResponse.json({
                    error: `Facebook Error: ${fbData.error?.message || 'Unknown error'}`,
                    details: fbData.error
                }, { status: 500 });
            }
        }



        // 3. Update post status in DB and save fb_post_id
        const { error: updateError } = await supabase
            .from('generated_posts')
            .update({
                status: 'posted',
                posted_at: new Date().toISOString(),
                payload: {
                    fb_post_id: fbData.id,
                    published_at: new Date().toISOString()
                }
            })
            .eq('id', id);

        if (updateError) {
            console.error('DB Update Error:', updateError);
            // Post was published but DB update failed - log but don't fail
        }

        return NextResponse.json({
            success: true,
            fb_post_id: fbData.id,
            message: 'Published to Facebook successfully!'
        });

    } catch (error) {
        console.error("Publish Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
