import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface FrequencyRecord {
  id: string;
  title: string;
  description: string;
  preset: Record<string, unknown>;
  image_url: string;
  created_at: string;
}
