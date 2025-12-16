import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

export const maxDuration = 60;

export async function GET(request: Request) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
        return NextResponse.json({
            error: 'Facebook credentials not configured',
            success: false
        }, { status: 500 });
    }

    try {
        console.log('[Auto-Post Cron] Starting...');

        // 1. Fetch approved posts that haven't been posted yet
        const { data: approvedPosts, error: fetchError } = await supabase
            .from('generated_posts')
            .select('*')
            .eq('status', 'approved')
            .is('posted_at', null)
            .order('created_at', { ascending: true })
            .limit(5); // Post max 5 per run

        if (fetchError) {
            throw new Error(`Failed to fetch approved posts: ${fetchError.message}`);
        }

        if (!approvedPosts || approvedPosts.length === 0) {
            console.log('[Auto-Post Cron] No approved posts to publish');
            return NextResponse.json({
                success: true,
                message: 'No approved posts to publish',
                posted: 0
            });
        }

        console.log(`[Auto-Post Cron] Found ${approvedPosts.length} approved posts`);

        const results = {
            posted: 0,
            failed: 0,
            details: [] as any[]
        };

        for (const post of approvedPosts) {
            try {
                console.log(`[Auto-Post Cron] Publishing post ${post.id}...`);

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
                        throw new Error(`Facebook API Error: ${fbData.error?.message || 'Unknown error'}`);
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
                        throw new Error(`Facebook API Error: ${fbData.error?.message || 'Unknown error'}`);
                    }
                }

                // 2. Update post status in DB
                const { error: updateError } = await supabase
                    .from('generated_posts')
                    .update({
                        status: 'posted',
                        posted_at: new Date().toISOString(),
                        payload: {
                            ...post.payload,
                            fb_post_id: fbData.id,
                            published_at: new Date().toISOString()
                        }
                    })
                    .eq('id', post.id);

                if (updateError) {
                    throw new Error(`DB Update Error: ${updateError.message}`);
                }

                console.log(`[Auto-Post Cron] ✅ Posted ${post.id} (FB ID: ${fbData.id})`);
                results.posted++;
                results.details.push({
                    post_id: post.id,
                    fb_post_id: fbData.id,
                    type: post.type,
                    status: 'success'
                });

                // Delay between posts to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (err: any) {
                console.error(`[Auto-Post Cron] ❌ Failed to post ${post.id}:`, err.message);
                results.failed++;
                results.details.push({
                    post_id: post.id,
                    type: post.type,
                    status: 'failed',
                    error: err.message
                });
            }
        }

        console.log(`[Auto-Post Cron] Done. Posted: ${results.posted}, Failed: ${results.failed}`);

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error) {
        console.error('[Auto-Post Cron] Error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
