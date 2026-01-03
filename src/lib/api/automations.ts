import { supabase } from '@/integrations/supabase/client';

export interface AutomationRun {
  id: string;
  automation_id: string;
  status: string;
  summary: string | null;
  duration: string | null;
  logs: string[];
  created_at: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  action_type: string;
  enabled: boolean;
  frequency: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  runs?: AutomationRun[];
}

export async function getAutomations(): Promise<Automation[]> {
  const { data, error } = await supabase
    .from('automations')
    .select(`
      *,
      runs:automation_runs(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Automation[];
}

export async function createAutomation(automation: {
  name: string;
  description?: string;
  trigger_type: string;
  action_type: string;
  enabled?: boolean;
  frequency?: string;
  settings?: Record<string, unknown>;
}): Promise<Automation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertData = {
    name: automation.name,
    description: automation.description,
    trigger_type: automation.trigger_type,
    action_type: automation.action_type,
    enabled: automation.enabled ?? true,
    frequency: automation.frequency ?? 'on-event',
    settings: automation.settings as unknown,
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('automations')
    .insert(insertData as never)
    .select()
    .single();

  if (error) throw error;
  return data as Automation;
}

export async function updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation> {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
  if (updates.action_type !== undefined) updateData.action_type = updates.action_type;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
  if (updates.settings !== undefined) updateData.settings = updates.settings;

  const { data, error } = await supabase
    .from('automations')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Automation;
}

export async function deleteAutomation(id: string): Promise<void> {
  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function addAutomationRun(automationId: string, run: {
  status: string;
  summary?: string;
  duration?: string;
  logs?: string[];
}): Promise<AutomationRun> {
  const { data, error } = await supabase
    .from('automation_runs')
    .insert({ automation_id: automationId, ...run })
    .select()
    .single();

  if (error) throw error;
  return data as AutomationRun;
}
