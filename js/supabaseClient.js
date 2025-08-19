// Replace with your own project values
const SUPABASE_URL = "https://braeakwpwdigxcyqegua.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYWVha3dwd2RpZ3hjeXFlZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjYyNDEsImV4cCI6MjA3MTIwMjI0MX0.uuTv4UMY7G5rjuY5GoI8oiZzWNDkZ2X9tAn4pbMwvNk";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
