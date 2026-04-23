import { createClient } from "@supabase/supabase-js";

const lovableUrl = import.meta.env.VITE_LOVABLE_URL ?? "";
const lovableAnonKey = import.meta.env.VITE_LOVABLE_ANON_KEY ?? "";

export const isLovableConfigured = Boolean(lovableUrl && lovableAnonKey);

export const lovable = createClient(lovableUrl || "https://example.invalid", lovableAnonKey || "anon", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
