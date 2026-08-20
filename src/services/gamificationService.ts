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
 * Atribui pontos por envio de atividade (apenas no 1º envio)
 */
export async function awardSubmission(userId: string, activityId: string, subjectId?: string | number): Promise<AwardResult | null> {
  try {
    const stringActivityId = activityId.toString();

    // 1. Verificar se o aluno já recebeu pontos pelo envio prévio desta mesma atividade
    const { data: existingPoints, error: checkError } = await supabase
      .from('gamification_points')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'submission')
      .eq('source_id', stringActivityId)
      .limit(1);

    if (checkError) {
      console.warn('Aviso ao consultar envios prévios na gamificação:', checkError);
    }

    if (existingPoints && existingPoints.length > 0) {
      console.log(`Aluno ${userId} já recebeu pontos pelo primeiro envio da atividade ${activityId}`);
      return { ok: true, awarded: 0, message: 'Pontos já concedidos no primeiro envio desta atividade.' };
    }

    const pointsToAward = 15; // Pontos padrão por entrega
    const { data, error } = await supabase
      .from('gamification_points')
      .insert({
        user_id: userId,
        source: 'submission',
        source_id: stringActivityId,
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
 * Helper para resolver URL de imagem/ícone da medalha
 */
export function getBadgeIconUrl(icon?: string | null, icon_url?: string | null): string {
  const url = icon_url || icon;
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return trimmed;
  }
  const apiUrl = (import.meta as any).env?.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl.replace('/api', '')}/uploads/${trimmed}`;
  }
  return trimmed;
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
      .maybeSingle();

    // 2. Obter histórico de pontuação
    const { data: history } = await supabase
      .from('gamification_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 3. Obter todas as insígnias/conquistas cadastradas
    const { data: allBadgesData } = await supabase
      .from('gamification_badges')
      .select('*')
      .order('threshold_points', { ascending: true });

    // 4. Obter medalhas atribuídas diretamente ao estudante
    const { data: userBadges } = await supabase
      .from('gamification_user_badges')
      .select(`
        badge_id,
        awarded_at,
        gamification_badges (
          id,
          key,
          name,
          description,
          icon,
          icon_url,
          threshold_points
        )
      `)
      .eq('user_id', userId);

    const totalPts = Number(totalData?.total_points || 0);

    const allBadges = (allBadgesData || []).map((b: any) => {
      const threshold = Number(b.threshold_points || 0);
      const isDirectlyAwarded = (userBadges || []).some((ub: any) => ub.badge_id === b.id);
      const isUnlocked = totalPts >= threshold || isDirectlyAwarded;
      const resolvedIcon = getBadgeIconUrl(b.icon, b.icon_url);

      return {
        id: b.id,
        key: b.key,
        name: b.name,
        title: b.name,
        description: b.description || '',
        threshold_points: threshold,
        points: threshold,
        min_points: b.min_points ?? 0,
        max_points: b.max_points ?? 0,
        icon: resolvedIcon,
        icon_url: resolvedIcon,
        unlocked: isUnlocked,
        progress: Math.min(totalPts, threshold)
      };
    });

    // Insígnias desbloqueadas pelo aluno
    const unlockedBadges = allBadges.filter(b => b.unlocked);

    // Insígnia atual (a de maior pontuação necessária que o aluno atingiu)
    const currentBadge = unlockedBadges.length > 0
      ? unlockedBadges[unlockedBadges.length - 1]
      : (allBadges.length > 0 && allBadges[0].threshold_points <= 0 ? allBadges[0] : null);

    // Próxima insígnia a desbloquear
    const nextBadge = allBadges.find(b => !b.unlocked && b.threshold_points > totalPts) || null;

    return {
      userId,
      total: { total_points: totalPts },
      totalPoints: totalPts,
      total_points: totalPts,
      currentBadge,
      current_badge: currentBadge,
      nextBadge,
      next_badge: nextBadge,
      history: (history || []).map((h: any) => ({
        id: h.id,
        source: h.source,
        source_id: h.source_id,
        reason: h.source === 'adjustment' ? h.source_id : (h.reason || ''),
        points: Number(h.points),
        created_at: h.created_at,
        subject_name: h.subject_name
      })),
      badges: unlockedBadges,
      unlocked_badges: unlockedBadges,
      all_badges: allBadges,
      unlocked_by_subject: []
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
        source_id: payload.reason,
        subject_id: payload.subject_id ? Number(payload.subject_id) : null,
        points: payload.points
      })
      .select()
      .single();

    if (error) throw error;
    try { (window as any).dispatchEvent(new CustomEvent('gamification:update', { detail: data })); } catch (e) { /* noop */ }
    return { success: true, data };
  } catch (err) {
    console.error('Erro ao realizar ajuste manual no Supabase:', err);
    return { error: true, status: 500 };
  }
}

/**
 * Obtém o ranking (leaderboard) dos estudantes com maiores pontuações e suas insígnias atuais
 */
export async function getTopStudents(limit = 10) {
  try {
    const { data: totalsData, error: totalsError } = await supabase
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

    if (totalsError) throw totalsError;

    // Buscar todas as conquistas/insígnias para mapear a insígnia de cada aluno
    const { data: badgesData } = await supabase
      .from('gamification_badges')
      .select('*')
      .order('threshold_points', { ascending: true });

    const allBadges = (badgesData || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      threshold_points: Number(b.threshold_points || 0),
      icon: getBadgeIconUrl(b.icon, b.icon_url),
      icon_url: getBadgeIconUrl(b.icon, b.icon_url)
    }));

    return (totalsData || []).map((item: any) => {
      const points = Number(item.total_points || 0);
      const unlocked = allBadges.filter(b => points >= b.threshold_points);
      const currentBadge = unlocked.length > 0 ? unlocked[unlocked.length - 1] : (allBadges.length > 0 && allBadges[0].threshold_points <= 0 ? allBadges[0] : null);

      return {
        id: item.user_id,
        userId: item.user_id,
        user_id: item.user_id,
        fullName: item.profiles?.full_name || 'Aluno',
        full_name: item.profiles?.full_name || 'Aluno',
        name: item.profiles?.full_name || 'Aluno',
        grade: item.profiles?.grade || '',
        totalPoints: points,
        total_points: points,
        points: points,
        current_badge: currentBadge,
        currentBadge: currentBadge,
        current_achievement: currentBadge?.name || ''
      };
    });
  } catch (err) {
    console.error('Erro ao obter ranking no Supabase:', err);
    return null;
  }
}


