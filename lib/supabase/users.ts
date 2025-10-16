import { createServiceClient } from './server';

// Server functions (use createServiceClient - bypasses RLS)
export async function getUserProfile(clerkId: string) {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateSlug(clerkId: string, urlSlug: string) {
  const supabase = createServiceClient();
  const existingSlug = await supabase.from('user_profiles').select('url_slug').eq('url_slug', urlSlug).single();
  if (existingSlug) {
    return {error: 'Slug already exists'};
  }
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ url_slug: urlSlug })
    .eq('clerk_id', clerkId)
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
}

// Client functions (use createClient - respects RLS)



