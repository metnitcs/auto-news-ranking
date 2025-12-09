import { NextResponse } from 'next/server';

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fbPostId = searchParams.get('fb_post_id');

        if (!fbPostId) {
            return NextResponse.json({ error: 'Missing fb_post_id' }, { status: 400 });
        }

        if (!FB_PAGE_ACCESS_TOKEN) {
            return NextResponse.json({ error: 'Facebook token not configured' }, { status: 500 });
        }

        // Fetch basic post engagement data (available without special permissions)
        const metricsUrl = `https://graph.facebook.com/v18.0/${fbPostId}?fields=shares,reactions.summary(true),comments.summary(true)&access_token=${FB_PAGE_ACCESS_TOKEN}`;

        const response = await fetch(metricsUrl);
        const data = await response.json();

        if (!response.ok) {
            console.error('Facebook Insights Error:', data);
            return NextResponse.json({
                error: data.error?.message || 'Failed to fetch insights',
                details: data.error
            }, { status: 500 });
        }

        // Parse the response - basic engagement only
        const insights = {
            fb_post_id: fbPostId,
            reactions: data.reactions?.summary?.total_count || 0,
            comments: data.comments?.summary?.total_count || 0,
            shares: data.shares?.count || 0,
        };

        return NextResponse.json({ success: true, insights });

    } catch (error) {
        console.error("Insights Fetch Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

