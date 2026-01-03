import { supabase } from '@/integrations/supabase/client';

export interface Draft {
  id: string;
  user_id: string;
  title: string;
  type: string;
  platform: string;
  content: string;
  related_video_id: string | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DraftWithVideo extends Draft {
  video_status?: string | null;
  video_title?: string | null;
}

export async function getDrafts(): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Draft[];
}

export async function getDraftsWithVideoStatus(): Promise<DraftWithVideo[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select(`
      *,
      videos:related_video_id (
        status,
        title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((d: any) => ({
    ...d,
    video_status: d.videos?.status || null,
    video_title: d.videos?.title || null,
    videos: undefined,
  })) as DraftWithVideo[];
}

export async function createDraft(draft: Omit<Draft, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Draft> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('drafts')
    .insert({ ...draft, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Draft;
}

export async function updateDraft(id: string, updates: Partial<Draft>): Promise<Draft> {
  const { data, error } = await supabase
    .from('drafts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Draft;
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
