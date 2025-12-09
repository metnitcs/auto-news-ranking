import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using service role for admin tasks like crawling

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
