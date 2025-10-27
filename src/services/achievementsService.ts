import api from './api';
import { Achievement, AchievementCreatePayload } from '../models/achievement';

export async function getAchievements(): Promise<Achievement[] | { error: true; status?: number } > {
  try {
    const resp = await api.get('/gamification/achievements');
    // backend may return { data: [...] } or [...]
    const data = resp.data && resp.data.data ? resp.data.data : resp.data;
    
    // Mapear os campos do backend para o modelo do frontend
    const mappedData = (data || []).map((item: any) => ({
      id: item.id,
      key: item.key,
      title: item.name, // mapear 'name' para 'title'
      description: item.description,
      points: item.threshold_points, // mapear 'threshold_points' para 'points'
      minPoints: item.minPoints,
      maxPoints: item.maxPoints,
      imageUrl: item.icon_url || item.icon, // usar icon_url primeiro, depois icon
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    return mappedData;
  } catch (err: any) {
    console.error('achievementsService.getAchievements error', err);
    return { error: true, status: err?.response?.status };
  }
}

export async function createAchievement(payload: AchievementCreatePayload): Promise<Achievement | { error: true; status?: number } | null> {
  try {
    const resp = await api.post('/gamification/achievements', payload);
    // dispatch update so other parts can refresh
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: resp.data })); } catch (e) { /* noop */ }
    
    // Mapear o retorno do backend para o modelo do frontend
    const item = resp.data;
    if (item) {
      return {
        id: item.id,
        key: item.key,
        title: item.name || payload.title,
        description: item.description || payload.description,
        points: item.threshold_points || payload.points,
        minPoints: item.minPoints || payload.minPoints,
        maxPoints: item.maxPoints || payload.maxPoints,
        imageUrl: item.icon_url || item.icon || payload.imageUrl,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    }
    return resp.data;
  } catch (err: any) {
    console.error('achievementsService.createAchievement error', err);
    return { error: true, status: err?.response?.status };
  }
}

export async function updateAchievement(id: string | number, payload: Partial<AchievementCreatePayload>): Promise<Achievement | { error: true; status?: number } | null> {
  try {
    const resp = await api.put(`/gamification/achievements/${encodeURIComponent(String(id))}`, payload);
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: resp.data })); } catch (e) { /* noop */ }
    
    // Mapear o retorno do backend para o modelo do frontend
    const item = resp.data;
    if (item) {
      return {
        id: item.id,
        key: item.key,
        title: item.name || payload.title,
        description: item.description || payload.description,
        points: item.threshold_points || payload.points,
        minPoints: item.minPoints || payload.minPoints,
        maxPoints: item.maxPoints || payload.maxPoints,
        imageUrl: item.icon_url || item.icon || payload.imageUrl,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    }
    return resp.data;
  } catch (err: any) {
    console.error('achievementsService.updateAchievement error', err);
    return { error: true, status: err?.response?.status };
  }
}

export async function deleteAchievement(id: string | number): Promise<{ ok?: boolean } | { error: true; status?: number } | null> {
  try {
    const resp = await api.delete(`/gamification/achievements/${encodeURIComponent(String(id))}`);
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: { deletedId: id } })); } catch (e) { /* noop */ }
    return resp.data || { ok: true };
  } catch (err: any) {
    console.error('achievementsService.deleteAchievement error', err);
    return { error: true, status: err?.response?.status };
  }
}
