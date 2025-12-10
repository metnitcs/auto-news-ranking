import { supabase } from '@/lib/supabase';
import Parser from 'rss-parser';

export async function runCrawler() {
    console.log("Starting Real Crawler (Apify/RSS)...");
    const parser = new Parser();
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 1. Fetch Sources from DB
    const { data: sources, error: sourceError } = await supabase
        .from('tracked_sources')
        .select('*')
        .eq('is_active', true);

    if (sourceError || !sources || sources.length === 0) {
        console.log("No active sources found.");
        return { message: "No active sources found to crawl." };
    }

    for (const source of sources) {
        try {
            console.log(`Crawling ${source.name} (${source.type})...`);

            let items: any[] = [];

            if (source.type === 'rss') {
                const feed = await parser.parseURL(source.source_id);
                // Safe check for feed items
                const feedItems = feed.items || [];
                items = feedItems.slice(0, 10).map(item => ({
                    source: 'rss',
                    source_id: item.link || item.guid,
                    title: item.title,
                    content: item.contentSnippet || item.content || item.summary || "",
                    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    original_url: item.link,
                    // RSS usually doesn't have engagement metrics
                    likes: 0,
                    shares: 0,
                    comments: 0,
                    reactions: 0
                }));
            } else if (source.type === 'facebook_page') {
                // Apify Integration with Dual Token System
                // Use APIFY_API_TOKEN for days 1-15, APIFY_API_TOKEN_2 for days 16-31
                const dayOfMonth = new Date().getDate();
                const apifyToken = dayOfMonth <= 15
                    ? process.env.APIFY_API_TOKEN
                    : (process.env.APIFY_API_TOKEN_2 || process.env.APIFY_API_TOKEN);

                if (!apifyToken) {
                    console.warn(`Skipping FB Page ${source.name}: Missing APIFY_API_TOKEN`);
                    continue;
                }

                console.log(`Using Apify Token ${dayOfMonth <= 15 ? '#1' : '#2'} (Day ${dayOfMonth})`);

                // Validate URL
                if (!source.source_id.startsWith('http')) {
                    console.warn(`Invalid URL for ${source.name}: ${source.source_id}. Must be full URL.`);
                    continue;
                }

                console.log(`Calling Apify for ${source.name}...`);

                const runUrl = `https://api.apify.com/v2/acts/apify~facebook-posts-scraper/run-sync-get-dataset-items?token=${apifyToken}`;

                const runInput = {
                    startUrls: [{ url: source.source_id }],
                    resultsLimit: 5,
                    onlyPosts: true,
                    useStealth: true
                };

                const apifyRes = await fetch(runUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(runInput)
                });

                if (!apifyRes.ok) {
                    const errText = await apifyRes.text();
                    console.error(`Apify Error for ${source.name}:`, errText);
                    continue;
                }

                const apifyItems = await apifyRes.json();
                console.log(`Apify returned ${Array.isArray(apifyItems) ? apifyItems.length : 0} items for ${source.name}`);

                if (Array.isArray(apifyItems) && apifyItems.length > 0) {
                    // DEBUG
                    console.log(`[DEBUG] Keys of first item: ${Object.keys(apifyItems[0]).join(', ')}`);

                    items = apifyItems.map((post: any) => {
                        // Try multiple fields for content
                        const rawText = post.postText || post.text || post.message || post.caption || "";

                        // Try multiple fields for URL
                        const postUrl = post.url || post.postUrl || post.link || `https://facebook.com/${post.id}`;

                        // Try multiple fields for time
                        const timeRaw = post.time || post.timestamp || post.created_time || post.date;
                        const published = timeRaw ? new Date(timeRaw).toISOString() : new Date().toISOString();

                        return {
                            source: 'facebook_page',
                            source_id: postUrl,
                            title: rawText ? (rawText.substring(0, 100) + '...') : 'No Title',
                            content: rawText,
                            published_at: published,
                            original_url: postUrl,
                            // Metrics
                            likes: post.likes || 0,
                            shares: post.shares || 0,
                            comments: post.comments || 0,
                            reactions: post.topReactionsCount || post.reactionsCount || 0
                        };
                    });

                    // Filter empty content
                    items = items.filter((p: any) => p.content && p.content.length > 0);
                }
            }

            for (const item of items) {
                if (!item.title || !item.source_id) {
                    console.log(`Skipping invalid item`);
                    continue;
                }

                // Check duplicate
                const { data: existing } = await supabase
                    .from('news_raw')
                    .select('id')
                    .eq('source', item.source)
                    .eq('source_id', item.source_id)
                    .single();

                if (existing) {
                    // console.log(`Duplicate found for ${item.source_id}`);
                    skippedCount++;
                    continue;
                }

                // Insert
                const { error } = await supabase
                    .from('news_raw')
                    .insert({
                        source: item.source,
                        source_id: item.source_id,
                        title: item.title,
                        content: item.content,
                        created_at: item.published_at,
                        meta: {
                            source_name: source.name,
                            original_url: item.original_url,
                            engagement: {
                                likes: item.likes,
                                shares: item.shares,
                                comments: item.comments,
                                reactions: item.reactions
                            }
                        }
                    });

                if (error) {
                    console.error(`Error inserting ${item.title}:`, error);
                    errorCount++;
                } else {
                    console.log(`Successfully inserted: ${item.title}`);
                    insertedCount++;
                }
            }
        } catch (sourceErr: any) {
            console.error(`Failed to crawl source ${source.name}:`, sourceErr);
            errorCount++;
        }
    }

    return {
        success: true,
        summary: {
            sources: sources.length,
            inserted: insertedCount,
            skipped: skippedCount,
            errors: errorCount,
            debug_token_apify: !!process.env.APIFY_API_TOKEN
        }
    };
}
