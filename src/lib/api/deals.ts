import { supabase } from '@/integrations/supabase/client';

export interface DealMessage {
  id: string;
  deal_id: string;
  sender: string;
  content: string;
  subject?: string | null;
  gmail_message_id?: string | null;
  gmail_thread_id?: string | null;
  timestamp?: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  brand_name: string;
  brand_email: string | null;
  brand_logo: string | null;
  subject: string;
  status: string | null;
  deliverables: string[] | null;
  proposed_rate: number | null;
  source: string | null;
  gmail_thread_id: string | null;
  summary: string | null;
  contact_name: string | null;
  contact_email: string | null;
  extracted_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  messages?: DealMessage[];
}

export async function getDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      messages:deal_messages(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Deal[];
}

export async function createDeal(deal: {
  brand_name: string;
  brand_email?: string;
  subject: string;
  status?: string;
  deliverables?: string[];
  proposed_rate?: number;
}): Promise<Deal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...deal, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Deal;
}

export async function addDealMessage(dealId: string, message: { sender: string; content: string }): Promise<DealMessage> {
  const { data, error } = await supabase
    .from('deal_messages')
    .insert({ deal_id: dealId, ...message })
    .select()
    .single();

  if (error) throw error;
  return data as DealMessage;
}
