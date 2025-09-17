import 'react-native-url-polyfill';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amrmswsdehrpihnmbcrg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcm1zd3NkZWhycGlobm1iY3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUxMjIwNDksImV4cCI6MjAzMDY5ODA0OX0.88Lzw_Fq9VPDpK_FA0M9hJ3yhGvf66S7I8fixAV8HaE';

export const supabase = createClient(supabaseUrl, supabaseKey);

