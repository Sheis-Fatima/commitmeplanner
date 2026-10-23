import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const PUBLIC_SUPABASE_URL = "https://bkoddjcxpgrqwmfhvlgc.supabase.co";
const PUBLIC_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrb2RkamN4cGdycXdtZmh2bGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjQ0NzksImV4cCI6MjA5MTUwMDQ3OX0.aSI38ven8zgXygRu5aBIMd5gjloICWWBIVs0uCZlMW8";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
