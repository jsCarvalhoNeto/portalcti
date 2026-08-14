import { supabase } from '../lib/supabaseClient';

export interface AwardResult {
  ok?: boolean;
  awarded?: number;
  message?: string;
}

/**
 * Atribui pontos de acesso diário no Supabase
 */
export async function awardAccess(userId: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const pointsToAward = 5; // Pontos padrão por acesso
    const { data, error } = await supabase
      .from('gamification_points')
      .insert({
        user_id: userId,
        source: 'access',
        source_id: subjectId?.toString() || null,
        points: pointsToAward
      })
      .select()
      .single();

    if (error) throw error;

    const result = { ok: true, awarded: pointsToAward, message: 'Acesso diário premiado!' };
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: result })); } catch (e) { /* noop */ }
    return result;
  } catch (err) {
    console.error('Erro ao premiar acesso no Supabase:', err);
    return null;
  }
}

/**
 * Atribui pontos por jogo concluído
 */
export async function awardGame(userId: string, points: number, gameId?: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const { data, error } = await supabase
      .from('gamification_points')
      .insert({
        user_id: userId,
        source: 'game',
        source_id: gameId || subjectId?.toString() || null,
        points: points
      })
      .select()
      .single();

    if (error) throw error;

    const result = { ok: true, awarded: points, message: 'Pontos do jogo concedidos!' };
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: result })); } catch (e) { /* noop */ }
    return result;
  } catch (err) {
    console.error('Erro ao premiar conclusão de jogo no Supabase:', err);
    return null;
  }
}

/**
 * Atribui pontos por envio de atividade
 */
export async function awardSubmission(userId: string, activityId: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const pointsToAward = 15; // Pontos padrão por entrega
    const { data, error } = await supabase
      .from('gamification_points')
      .insert({
        user_id: userId,
        source: 'submission',
        source_id: activityId,
        subject_id: subjectId ? Number(subjectId) : null,
        points: pointsToAward
      })
      .select()
      .single();

    if (error) throw error;

    const result = { ok: true, awarded: pointsToAward, message: 'Pontos de entrega de atividade concedidos!' };
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: result })); } catch (e) { /* noop */ }
    return result;
  } catch (err) {
    console.error('Erro ao premiar entrega de atividade no Supabase:', err);
    return null;
  }
}

/**
 * Obtém informações consolidadas de gamificação de um estudante (pontos, histórico e badges)
 */
export async function getStudentGamification(userId: string, params?: { subject?: string; grade?: string }) {
  try {
    // 1. Obter total de pontos
    const { data: totalData } = await supabase
      .from('gamification_totals')
      .select('total_points')
      .eq('user_id', userId)
      .single();

    // 2. Obter histórico de pontuação
    const { data: history } = await supabase
      .from('gamification_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Obter medalhas do estudante
    const { data: badges } = await supabase
      .from('gamification_user_badges')
      .select(`
        awarded_at,
        gamification_badges (
          key,
          name,
          description,
          icon
        )
      `)
      .eq('user_id', userId);

    const totalPts = Number(totalData?.total_points || 0);

    return {
      userId,
      total: { total_points: totalPts },
      totalPoints: totalPts,
      total_points: totalPts,
      history: (history || []).map((h: any) => ({
        id: h.id,
        source: h.source,
        source_id: h.source_id,
        points: Number(h.points),
        created_at: h.created_at,
        subject_name: h.subject_name
      })),
      badges: (badges || []).map((b: any) => ({
        awarded_at: b.awarded_at,
        ...b.gamification_badges
      })),
      unlocked_badges: (badges || []).map((b: any) => ({
        awarded_at: b.awarded_at,
        ...b.gamification_badges
      }))
    };
  } catch (err) {
    console.error('Erro ao buscar dados de gamificação no Supabase:', err);
    return null;
  }
}

/**
 * Relatório consolidado de pontuação dos alunos para o professor
 */
export async function teacherReport(params?: { grade?: string }) {
  try {
    // 1. Tentar buscar com join em profiles
    let query = supabase
      .from('gamification_totals')
      .select(`
        user_id,
        total_points,
        last_updated,
        profiles(
          id,
          full_name,
          email,
          grade
        )
      `);

    const { data, error } = await query.order('total_points', { ascending: false });

    if (!error && data) {
      const adaptedData = data.map((item: any) => ({
        id: item.user_id,
        userId: item.user_id,
        user_id: item.user_id,
        studentName: item.profiles?.full_name || '—',
        full_name: item.profiles?.full_name || '—',
        email: item.profiles?.email || '',
        grade: item.profiles?.grade || '',
        totalPoints: Number(item.total_points || 0),
        total_points: Number(item.total_points || 0),
        lastUpdated: item.last_updated,
        last_updated: item.last_updated
      }));

      if (params?.grade && params.grade !== 'all') {
        return { data: adaptedData.filter(d => d.grade === params.grade) };
      }

      return { data: adaptedData };
    }

    // 2. Fallback caso o join falhe: buscar gamification_totals diretamente
    const { data: rawTotals, error: totalsError } = await supabase
      .from('gamification_totals')
      .select('user_id, total_points, last_updated')
      .order('total_points', { ascending: false });

    if (totalsError) throw totalsError;

    const adaptedData = (rawTotals || []).map((item: any) => ({
      id: item.user_id,
      userId: item.user_id,
      user_id: item.user_id,
      studentName: '—',
      full_name: '—',
      email: '',
      grade: '',
      totalPoints: Number(item.total_points || 0),
      total_points: Number(item.total_points || 0),
      lastUpdated: item.last_updated,
      last_updated: item.last_updated
    }));

    return { data: adaptedData };
  } catch (err: any) {
    console.error('Erro ao gerar relatório do professor no Supabase:', err);
    return { error: true, status: 500 };
  }
}

/**
 * Ajuste manual de pontos feito pelo professor
 */
export async function teacherAdjust(payload: { user_id?: string; userId?: string; points: number; subject_id?: string | number; reason: string }) {
  try {
    const targetUserId = payload.user_id || payload.userId;
    if (!targetUserId) throw new Error('user_id é obrigatório');

    const { data, error } = await supabase
      .from('gamification_points')
      .insert({
        user_id: targetUserId,
        source: 'adjustment',
        source_id: payload.reason, // Guarda a justificativa
        subject_id: payload.subject_id ? Number(payload.subject_id) : null,
        points: payload.points
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Erro ao realizar ajuste manual no Supabase:', err);
    return { error: true, status: 500 };
  }
}

/**
 * Obtém o ranking (leaderboard) dos estudantes com maiores pontuações
 */
export async function getTopStudents(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('gamification_totals')
      .select(`
        user_id,
        total_points,
        profiles(
          full_name,
          grade
        )
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      userId: item.user_id,
      fullName: item.profiles?.full_name || 'Aluno',
      grade: item.profiles?.grade || '',
      totalPoints: Number(item.total_points || 0)
    }));
  } catch (err) {
    console.error('Erro ao obter ranking no Supabase:', err);
    return null;
  }
}

