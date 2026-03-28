import 'react-native-url-polyfill';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseKey);

