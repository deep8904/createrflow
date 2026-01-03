import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  creator_type: string | null;
  platforms: string[];
  personal_style: {
    tone: string;
    wordsToUse: string[];
    wordsToAvoid: string[];
    aboutMe: string;
    exampleCaptions: string[];
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function completeOnboarding(
  userId: string,
  data: {
    creator_type: string;
    platforms: string[];
    personal_style: Profile['personal_style'];
  }
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      onboarding_completed: true,
    })
    .eq('id', userId);

  if (error) throw error;
}
