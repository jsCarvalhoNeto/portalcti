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
      description: item.description || '',
      points: Number(item.threshold_points || 0),
      minPoints: item.min_points ?? item.minPoints ?? 0,
      maxPoints: item.max_points ?? item.maxPoints ?? 0,
      imageUrl: item.icon_url || item.icon || '',
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
    const generatedKey = payload.key?.trim() || `badge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const imageUrl = payload.imageUrl?.trim() || '';

    const { data, error } = await supabase
      .from('gamification_badges')
      .insert({
        key: generatedKey,
        name: payload.title,
        description: payload.description || '',
        threshold_points: payload.points ?? 0,
        min_points: payload.minPoints ?? 0,
        max_points: payload.maxPoints ?? 0,
        icon: imageUrl,
        icon_url: imageUrl
      })
      .select()
      .single();

    if (error) throw error;

    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: data })); } catch (e) { /* noop */ }

    return {
      id: data.id,
      key: data.key,
      title: data.name,
      description: data.description || '',
      points: Number(data.threshold_points || 0),
      minPoints: data.min_points ?? data.minPoints ?? 0,
      maxPoints: data.max_points ?? data.maxPoints ?? 0,
      imageUrl: data.icon_url || data.icon || '',
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
    const updateObj: any = {};
    if (payload.key !== undefined) updateObj.key = payload.key;
    if (payload.title !== undefined) updateObj.name = payload.title;
    if (payload.description !== undefined) updateObj.description = payload.description;
    if (payload.points !== undefined) updateObj.threshold_points = payload.points;
    if (payload.minPoints !== undefined) updateObj.min_points = payload.minPoints;
    if (payload.maxPoints !== undefined) updateObj.max_points = payload.maxPoints;
    if (payload.imageUrl !== undefined) {
      updateObj.icon = payload.imageUrl?.trim() || '';
      updateObj.icon_url = payload.imageUrl?.trim() || '';
    }

    const { data, error } = await supabase
      .from('gamification_badges')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: data })); } catch (e) { /* noop */ }

    return {
      id: data.id,
      key: data.key,
      title: data.name,
      description: data.description || '',
      points: Number(data.threshold_points || 0),
      minPoints: data.min_points ?? data.minPoints ?? 0,
      maxPoints: data.max_points ?? data.maxPoints ?? 0,
      imageUrl: data.icon_url || data.icon || '',
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
