import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  user_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  tags: string[];
  published_at: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  views: number;
  likes: number;
  comments_count: number;
  status: string;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get only active videos (default behavior)
export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .neq('status', 'removed')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data as Video[];
}

// Get all videos including removed ones
export async function getAllVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data as Video[];
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Video | null;
}
