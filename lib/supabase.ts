import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/types/database";

// Client-side Supabase client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
