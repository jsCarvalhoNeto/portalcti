import { supabase } from '../lib/supabaseClient';
import { Achievement, AchievementCreatePayload } from '../models/achievement';

export async function getAchievements(): Promise<Achievement[] | { error: true; status?: number } > {
  try {
    const { data, error } = await supabase
      .from('gamification_badges')
      .select('*')
      .order('threshold_points', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      key: item.key,
      title: item.name,
      description: item.description,
      points: item.threshold_points,
      minPoints: item.minPoints || 0,
      maxPoints: item.maxPoints || 0,
      imageUrl: item.icon,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (err: any) {
    console.error('Erro ao buscar conquistas no Supabase:', err);
    return { error: true, status: 500 };
  }
}

export async function createAchievement(payload: AchievementCreatePayload): Promise<Achievement | { error: true; status?: number } | null> {
  try {
    const { data, error } = await supabase
      .from('gamification_badges')
      .insert({
        key: payload.key,
        name: payload.title,
        description: payload.description,
        threshold_points: payload.points,
        icon: payload.imageUrl
      })
      .select()
      .single();

    if (error) throw error;

    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: data })); } catch (e) { /* noop */ }

    return {
      id: data.id,
      key: data.key,
      title: data.name,
      description: data.description,
      points: data.threshold_points,
      minPoints: data.minPoints || 0,
      maxPoints: data.maxPoints || 0,
      imageUrl: data.icon,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err: any) {
    console.error('Erro ao criar conquista no Supabase:', err);
    return { error: true, status: 500 };
  }
}

export async function updateAchievement(id: string | number, payload: Partial<AchievementCreatePayload>): Promise<Achievement | { error: true; status?: number } | null> {
  try {
    const { data, error } = await supabase
      .from('gamification_badges')
      .update({
        key: payload.key,
        name: payload.title,
        description: payload.description,
        threshold_points: payload.points,
        icon: payload.imageUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: data })); } catch (e) { /* noop */ }

    return {
      id: data.id,
      key: data.key,
      title: data.name,
      description: data.description,
      points: data.threshold_points,
      minPoints: data.minPoints || 0,
      maxPoints: data.maxPoints || 0,
      imageUrl: data.icon,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err: any) {
    console.error('Erro ao atualizar conquista no Supabase:', err);
    return { error: true, status: 500 };
  }
}

export async function deleteAchievement(id: string | number): Promise<{ ok?: boolean } | { error: true; status?: number } | null> {
  try {
    const { error } = await supabase
      .from('gamification_badges')
      .delete()
      .eq('id', id);

    if (error) throw error;

    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: { deletedId: id } })); } catch (e) { /* noop */ }
    return { ok: true };
  } catch (err: any) {
    console.error('Erro ao deletar conquista no Supabase:', err);
    return { error: true, status: 500 };
  }
}

