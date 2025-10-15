import { createServiceClient } from './server';

/**
 * Busca un perfil de usuario por su Clerk ID
 * @param clerkId - El ID de Clerk del usuario
 * @returns El perfil del usuario o null si no se encuentra
 */
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

/**
 * Obtiene todos los perfiles de usuario
 * @returns Array de todos los perfiles de usuario
 */
export async function getAllUserProfiles() {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');

  if (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }

  return data;
}
