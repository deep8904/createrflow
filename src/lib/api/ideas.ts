import { supabase } from '@/integrations/supabase/client';

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  category: string;
  difficulty: string;
  status: string;
  source: string | null;
  source_type: string;
  estimated_length: string | null;
  hooks: string[];
  outline: string[];
  suggested_titles: string[];
  created_at: string;
  updated_at: string;
}

export async function getIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Idea[];
}

export async function createIdea(idea: {
  title: string;
  platform?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  source?: string;
  source_type?: string;
  estimated_length?: string;
}): Promise<Idea> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ideas')
    .insert({ ...idea, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Idea;
}

export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
  const { data, error } = await supabase
    .from('ideas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Idea;
}

export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
