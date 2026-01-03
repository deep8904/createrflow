import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Types matching our database schema
export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: 'published' | 'processing' | 'scheduled';
  tags: string[];
  description: string;
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  publishedAt: string;
  intentTag: 'Question' | 'Praise' | 'Feedback' | 'Hate' | null;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | null;
}

export interface Draft {
  id: string;
  title: string;
  type: string;
  platform: string;
  content: string;
  relatedVideoId?: string;
  createdAt: string;
  status: 'Draft' | 'Ready' | 'Posted';
  versions: number;
}

export interface Deal {
  id: string;
  brandName: string;
  brandEmail: string;
  brandLogo: string;
  subject: string;
  status: 'New' | 'Negotiating' | 'Closed';
  lastUpdated: string;
  deliverables: string[];
  proposedRate?: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'failed' | 'running';
  frequency: 'daily' | 'weekly' | 'on-event';
}

export interface Idea {
  id: string;
  title: string;
  source: string;
  sourceType: 'comment' | 'video' | 'manual';
  platform: 'YouTube' | 'Instagram' | 'TikTok' | 'LinkedIn' | 'X';
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'New' | 'Scripted' | 'Filming' | 'Posted';
  estimatedLength: string;
  createdAt: string;
  hooks?: string[];
  outline?: string[];
  suggestedTitles?: string[];
}

interface AppState {
  videos: Video[];
  comments: Comment[];
  drafts: Draft[];
  deals: Deal[];
  automations: Automation[];
  ideas: Idea[];
  isLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  refreshData: () => Promise<void>;
  refreshVideos: () => Promise<void>;
  refreshComments: () => Promise<void>;
  refreshDrafts: () => Promise<void>;
  refreshDeals: () => Promise<void>;
  refreshAutomations: () => Promise<void>;
  refreshIdeas: () => Promise<void>;
  addDraft: (draft: Omit<Draft, 'id' | 'createdAt'>) => Promise<void>;
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  moveIdea: (id: string, status: Idea['status']) => Promise<void>;
  toggleAutomation: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    videos: [],
    comments: [],
    drafts: [],
    deals: [],
    automations: [],
    ideas: [],
    isLoading: true,
    error: null,
  });

  // Fetch all data when user changes
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setState({
        videos: [],
        comments: [],
        drafts: [],
        deals: [],
        automations: [],
        ideas: [],
        isLoading: false,
        error: null,
      });
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    setState(s => ({ ...s, isLoading: true }));
    try {
      await Promise.all([
        refreshVideos(),
        refreshComments(),
        refreshDrafts(),
        refreshDeals(),
        refreshAutomations(),
        refreshIdeas(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setState(s => ({ ...s, error: 'Failed to load data' }));
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const refreshVideos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'removed')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return;
    }

    const videos: Video[] = (data || []).map(v => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail_url || '',
      publishedAt: v.published_at || v.created_at || '',
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments_count || 0,
      duration: v.duration || '',
      status: (v.status as Video['status']) || 'published',
      tags: v.tags || [],
      description: v.description || '',
    }));

    setState(s => ({ ...s, videos }));
  };

  const refreshComments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    const comments: Comment[] = (data || []).map(c => ({
      id: c.id,
      videoId: c.video_id || c.youtube_video_id,
      author: c.author,
      avatar: c.author_avatar || '',
      content: c.text,
      likes: c.like_count || 0,
      publishedAt: c.published_at || c.created_at || '',
      intentTag: c.intent_tag as Comment['intentTag'],
      sentiment: c.sentiment as Comment['sentiment'],
    }));

    setState(s => ({ ...s, comments }));
  };

  const refreshDrafts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      return;
    }

    const drafts: Draft[] = (data || []).map(d => ({
      id: d.id,
      title: d.title,
      type: d.type,
      platform: d.platform,
      content: d.content,
      relatedVideoId: d.related_video_id || undefined,
      createdAt: d.created_at || '',
      status: (d.status as Draft['status']) || 'Draft',
      versions: d.version || 1,
    }));

    setState(s => ({ ...s, drafts }));
  };

  const refreshDeals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      return;
    }

    const deals: Deal[] = (data || []).map(d => ({
      id: d.id,
      brandName: d.brand_name,
      brandEmail: d.brand_email || '',
      brandLogo: d.brand_logo || '',
      subject: d.subject,
      status: (d.status as Deal['status']) || 'New',
      lastUpdated: d.updated_at || d.created_at || '',
      deliverables: d.deliverables || [],
      proposedRate: d.proposed_rate || undefined,
    }));

    setState(s => ({ ...s, deals }));
  };

  const refreshAutomations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching automations:', error);
      return;
    }

    const automations: Automation[] = (data || []).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description || '',
      trigger: a.trigger_type,
      action: a.action_type,
      enabled: a.enabled ?? true,
      frequency: (a.frequency as Automation['frequency']) || 'on-event',
    }));

    setState(s => ({ ...s, automations }));
  };

  const refreshIdeas = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideas:', error);
      return;
    }

    const ideas: Idea[] = (data || []).map(i => ({
      id: i.id,
      title: i.title,
      source: i.source || '',
      sourceType: (i.source_type as Idea['sourceType']) || 'manual',
      platform: (i.platform as Idea['platform']) || 'YouTube',
      category: i.category || 'General',
      difficulty: (i.difficulty as Idea['difficulty']) || 'Medium',
      status: (i.status as Idea['status']) || 'New',
      estimatedLength: i.estimated_length || '',
      createdAt: i.created_at || '',
      hooks: (i.hooks as string[]) || [],
      outline: (i.outline as string[]) || [],
      suggestedTitles: (i.suggested_titles as string[]) || [],
    }));

    setState(s => ({ ...s, ideas }));
  };

  const addDraft = async (draft: Omit<Draft, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('drafts').insert({
      user_id: user.id,
      title: draft.title,
      type: draft.type,
      platform: draft.platform,
      content: draft.content,
      related_video_id: draft.relatedVideoId,
      status: draft.status,
      version: draft.versions,
    });

    if (error) {
      console.error('Error adding draft:', error);
      return;
    }

    await refreshDrafts();
  };

  const updateDraft = async (id: string, updates: Partial<Draft>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.versions !== undefined) dbUpdates.version = updates.versions;

    const { error } = await supabase
      .from('drafts')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating draft:', error);
      return;
    }

    await refreshDrafts();
  };

  const deleteDraft = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting draft:', error);
      return;
    }

    await refreshDrafts();
  };

  const addIdea = async (idea: Omit<Idea, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      title: idea.title,
      source: idea.source,
      source_type: idea.sourceType,
      platform: idea.platform,
      category: idea.category,
      difficulty: idea.difficulty,
      status: idea.status,
      estimated_length: idea.estimatedLength,
      hooks: idea.hooks,
      outline: idea.outline,
      suggested_titles: idea.suggestedTitles,
    });

    if (error) {
      console.error('Error adding idea:', error);
      return;
    }

    await refreshIdeas();
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.estimatedLength !== undefined) dbUpdates.estimated_length = updates.estimatedLength;
    if (updates.hooks !== undefined) dbUpdates.hooks = updates.hooks;
    if (updates.outline !== undefined) dbUpdates.outline = updates.outline;
    if (updates.suggestedTitles !== undefined) dbUpdates.suggested_titles = updates.suggestedTitles;

    const { error } = await supabase
      .from('ideas')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating idea:', error);
      return;
    }

    await refreshIdeas();
  };

  const moveIdea = async (id: string, status: Idea['status']) => {
    await updateIdea(id, { status });
  };

  const toggleAutomation = async (id: string) => {
    if (!user) return;
    const automation = state.automations.find(a => a.id === id);
    if (!automation) return;

    const { error } = await supabase
      .from('automations')
      .update({ enabled: !automation.enabled })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling automation:', error);
      return;
    }

    await refreshAutomations();
  };

  const setLoading = (loading: boolean) => {
    setState(s => ({ ...s, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(s => ({ ...s, error }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshData,
        refreshVideos,
        refreshComments,
        refreshDrafts,
        refreshDeals,
        refreshAutomations,
        refreshIdeas,
        addDraft,
        updateDraft,
        deleteDraft,
        addIdea,
        updateIdea,
        moveIdea,
        toggleAutomation,
        setLoading,
        setError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
