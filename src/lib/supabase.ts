import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skuzzsrfrgcmszejwktu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdXp6c3JmcmdjbXN6ZWp3a3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTY1NjYsImV4cCI6MjA2MTYzMjU2Nn0.sdeZQY9WMFoHOtTXM9hOt2-gEZEUq4rmxvOWn-HABWk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
