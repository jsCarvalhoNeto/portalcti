import api from './api';

export interface AwardResult {
  ok?: boolean;
  awarded?: number;
  message?: string;
}

export async function awardAccess(userId: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const payload: any = { userId };
    if (subjectId !== undefined) payload.subject_id = subjectId;
    const resp = await api.post('/gamification/award-access', payload);
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: resp.data })); } catch (e) { /* noop */ }
    return resp.data;
  } catch (err) {
    console.error('gamificationService.awardAccess error', err);
    return null;
  }
}

export async function awardGame(userId: string, points: number, gameId?: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const payload: any = { userId, points };
    if (gameId !== undefined) payload.gameId = gameId;
    if (subjectId !== undefined) payload.subject_id = subjectId;
    const resp = await api.post('/gamification/award-game', payload);
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: resp.data })); } catch (e) { /* noop */ }
    return resp.data;
  } catch (err) {
    console.error('gamificationService.awardGame error', err);
    return null;
  }
}

export async function awardSubmission(userId: string, activityId: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const payload: any = { userId, activityId };
    if (subjectId !== undefined) payload.subject_id = subjectId;
    const resp = await api.post('/gamification/award-submission', payload);
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: resp.data })); } catch (e) { /* noop */ }
    return resp.data;
  } catch (err) {
    console.error('gamificationService.awardSubmission error', err);
    return null;
  }
}

export async function getStudentGamification(userId: string) {
  try {
    const resp = await api.get(`/gamification/student/${userId}`);
    return resp.data;
  } catch (err) {
    console.error('gamificationService.getStudentGamification error', err);
    return null;
  }
}

export async function teacherReport(params?: { subject?: string; grade?: string; semester?: string; period?: string }) {
  try {
    const queryParts: string[] = [];
    if (params) {
      if (params.subject) queryParts.push(`subject=${encodeURIComponent(params.subject)}`);
      if (params.grade) queryParts.push(`grade=${encodeURIComponent(params.grade)}`);
      if (params.semester) queryParts.push(`semester=${encodeURIComponent(params.semester)}`);
      if (params.period) queryParts.push(`period=${encodeURIComponent(params.period)}`);
    }
    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
  const resp = await api.get(`/gamification/teacher/report${query}`);
  // return the backend payload directly (backend already wraps rows in { data })
  return resp.data;
  } catch (err: any) {
    console.error('gamificationService.teacherReport error', err);
    const status = err?.response?.status;
    return { error: true, status };
  }
}
