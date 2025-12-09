import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, action } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
        }

        if (action === 'delete') {
            const todayStr = new Date().toISOString().split('T')[0];

            // 1. Fetch current ranking for today
            const { data: currentRanking, error: fetchError } = await supabase
                .from('news_ranking_daily')
                .select('*')
                .eq('rank_date', todayStr)
                .single();

            if (fetchError || !currentRanking) {
                return NextResponse.json({ error: 'Ranking not found for today' }, { status: 404 });
            }

            // 2. Filter out the item
            const currentList = currentRanking.ranked_list || [];
            const newList = currentList.filter((item: any) => item.id !== id);

            // 3. Update the DB
            const { error: updateError } = await supabase
                .from('news_ranking_daily')
                .update({ ranked_list: newList })
                .eq('rank_date', todayStr);

            if (updateError) {
                throw updateError;
            }

            return NextResponse.json({ success: true, message: 'Item removed from ranking' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error("Ranking Action Failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
