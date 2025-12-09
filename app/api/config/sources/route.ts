
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tracked_sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ sources: data });
    } catch (error: any) {
        console.error("GET sources error:", error);
        return NextResponse.json({
            error: error.message || JSON.stringify(error)
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, name, source_id } = body;

        if (!type || !name || !source_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('tracked_sources')
            .insert({ type, name, source_id })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, source: data });
    } catch (error: any) {
        console.error("POST source error:", error);
        return NextResponse.json({
            error: error.message || JSON.stringify(error)
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const { error } = await supabase
            .from('tracked_sources')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE source error:", error);
        return NextResponse.json({
            error: error.message || JSON.stringify(error)
        }, { status: 500 });
    }
}
