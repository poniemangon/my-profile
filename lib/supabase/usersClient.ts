import { createClient } from './client';

// Client functions (use createClient - respects RLS)
export async function getUserProfileClient(clerkId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

    const { data: links, error: linksError } = await supabase
    .from('user_links')
    .select('*')
    .eq('user_profile_id', data.id);

  if (linksError) {
    console.error('Error fetching links (client):', linksError);
    return null;
  }
  data.links = links;

  if (error) {
    console.error('Error fetching user profile (client):', error);
    return null;
  }

  return data;
}

export async function updateSlugClient(clerkId: string, urlSlug: string) {
  const supabase = createClient();

  // Chequear si existe el slug
  const { data: existingSlug, error: checkError } = await supabase
    .from('user_profiles')
    .select('url_slug')
    .eq('url_slug', urlSlug)
    .single();

  if (existingSlug) {
    return { error: 'Slug already exists' };
  }
  if (checkError && checkError.code !== 'PGRST116') {
    // Error real diferente a no existe row
    console.error('Error checking slug (client):', checkError);
    return { error: 'Error checking slug', details: checkError.message };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ url_slug: urlSlug })
    .eq('clerk_id', clerkId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile (client):', error);
    return null;
  }

  return data;
}

