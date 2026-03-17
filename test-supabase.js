import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvhhnfnortsidmdupoka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aGhuZm5vcnRzaWRtZHVwb2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQ4ODQsImV4cCI6MjA4OTMzMDg4NH0.YkUH77IOzUTT2kHOssuXwx_Y7dDnp6bPsl732OT7tRs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });

  if (error) {
    console.error("Signup error:", error);
  } else {
    console.log("Signup data:", JSON.stringify(data, null, 2));
  }
}

test();
