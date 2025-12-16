import { supabase } from '@/lib/supabase';

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

interface PostToPublish {
    id: string;
    content: string;
    image_url: string | null;
    type: string;
    payload: any;
}

async function publishToFacebook(post: PostToPublish): Promise<string> {
    if (!FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
        throw new Error('Facebook credentials not configured');
    }

    let fbData;

    if (post.image_url) {
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

    return fbData.id;
}

export async function autoPostApprovedPosts(limit: number = 5) {
    console.log('[AutoPost] Fetching approved posts...');

    const { data: approvedPosts, error: fetchError } = await supabase
        .from('generated_posts')
        .select('*')
        .eq('status', 'approved')
        .is('posted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (fetchError) {
        throw new Error(`Failed to fetch approved posts: ${fetchError.message}`);
    }

    if (!approvedPosts || approvedPosts.length === 0) {
        return { posted: 0, failed: 0, details: [] };
    }

    const results = { posted: 0, failed: 0, details: [] as any[] };

    for (const post of approvedPosts) {
        try {
            console.log(`[AutoPost] Publishing ${post.id}...`);
            const fbPostId = await publishToFacebook(post);

            const { error: updateError } = await supabase
                .from('generated_posts')
                .update({
                    status: 'posted',
                    posted_at: new Date().toISOString(),
                    payload: {
                        ...post.payload,
                        fb_post_id: fbPostId,
                        published_at: new Date().toISOString()
                    }
                })
                .eq('id', post.id);

            if (updateError) throw new Error(`DB Update Error: ${updateError.message}`);

            console.log(`[AutoPost] ✅ Posted ${post.id}`);
            results.posted++;
            results.details.push({
                post_id: post.id,
                fb_post_id: fbPostId,
                type: post.type,
                status: 'success'
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (err: any) {
            console.error(`[AutoPost] ❌ Failed ${post.id}:`, err.message);
            results.failed++;
            results.details.push({
                post_id: post.id,
                type: post.type,
                status: 'failed',
                error: err.message
            });
        }
    }

    return results;
}
