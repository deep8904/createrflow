import { supabase } from '@/integrations/supabase/client';

export interface Integration {
  id: string;
  user_id: string;
  provider: string;
  connected: boolean;
  channel_id: string | null;
  channel_name: string | null;
  channel_thumbnail: string | null;
  subscribers: number;
  last_sync_at: string | null;
  filter_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function getYouTubeIntegration(): Promise<Integration | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'youtube')
    .maybeSingle();

  if (error) throw error;
  return data as Integration | null;
}

export async function getGmailIntegration(): Promise<Integration | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'gmail')
    .maybeSingle();

  if (error) throw error;
  return data as Integration | null;
}

export async function startYouTubeOAuth(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const redirectUrl = `${window.location.origin}/app/settings`;

  const { data, error } = await supabase.functions.invoke('youtube-oauth-start', {
    body: {
      userId: session.user.id,
      redirect: redirectUrl,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const anyErr = error as any;
    const status = anyErr?.context?.status;
    const statusText = anyErr?.context?.statusText;
    const body = anyErr?.context?.body;

    const details = [
      status ? `status=${status}` : null,
      statusText ? `statusText=${statusText}` : null,
      body ? `body=${typeof body === 'string' ? body : JSON.stringify(body)}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    throw new Error(details ? `${error.message} (${details})` : error.message);
  }

  if (data?.error) throw new Error(data.error);

  return data.url;
}

export async function startGmailOAuth(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const redirectUrl = `${window.location.origin}/app/settings`;

  const { data, error } = await supabase.functions.invoke('gmail-oauth-start', {
    body: {
      userId: session.user.id,
      redirect: redirectUrl,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) throw new Error(data.error);

  return data.url;
}

export async function syncYouTubeVideos(): Promise<{ videosCount: number; commentsCount: number; removedCount?: number; reactivatedCount?: number }> {
  const { data, error } = await supabase.functions.invoke('youtube-sync');

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  
  return data;
}

export async function syncGmailEmails(): Promise<{ dealsCreated: number; messagesAdded: number; message: string }> {
  const { data, error } = await supabase.functions.invoke('gmail-sync');

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  
  return data;
}

export async function disconnectYouTube(deleteData: boolean = false): Promise<void> {
  const { data, error } = await supabase.functions.invoke('youtube-disconnect', {
    body: { deleteData },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export async function disconnectGmail(deleteData: boolean = false): Promise<void> {
  const { data, error } = await supabase.functions.invoke('gmail-disconnect', {
    body: { deleteData },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
