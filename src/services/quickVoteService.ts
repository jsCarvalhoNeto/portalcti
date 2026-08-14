import { supabase } from '../lib/supabaseClient';

export type QuickVoteStatus = 'active' | 'closed';

export interface QuickVoteSession {
  id: number;
  publicHash: string;
  title: string;
  subjectId: number;
  subjectName: string;
  subjectGrade?: string;
  validationMode: 'public_name' | 'session_if_available' | 'session_required';
  status: QuickVoteStatus;
  createdAt: string;
  closedAt?: string | null;
  totalVotes?: number;
  averageScore?: number;
  sharePath: string;
  shareUrl: string;
}

export interface QuickVoteVote {
  id: number;
  studentName: string;
  score: number;
  votedAt: string;
}

export interface QuickVoteDistributionItem {
  score: number;
  votes: number;
}

export interface QuickVoteLivePanel {
  quickVote: QuickVoteSession;
  totalVotes: number;
  averageScore: number;
  distribution: QuickVoteDistributionItem[];
  votes: QuickVoteVote[];
}

function normalizeStudentName(name: string) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function createQuickVote(payload: {
  title: string;
  subjectId: number;
  validationMode?: 'public_name' | 'session_if_available' | 'session_required';
}): Promise<QuickVoteSession> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('quick_votes')
      .insert({
        title: payload.title,
        subject_id: payload.subjectId,
        teacher_id: user.id,
        validation_mode: payload.validationMode || 'public_name',
        status: 'active'
      })
      .select(`
        *,
        subjects(name, grade)
      `)
      .single();

    if (error) throw error;

    return {
      id: Number(data.id),
      publicHash: data.public_hash,
      title: data.title,
      subjectId: Number(data.subject_id),
      subjectName: data.subjects.name,
      subjectGrade: data.subjects.grade,
      validationMode: data.validation_mode,
      status: data.status,
      createdAt: data.created_at,
      closedAt: data.closed_at,
      sharePath: `/votar/${data.public_hash}`,
      shareUrl: `${window.location.origin}/votar/${data.public_hash}`
    };
  } catch (error: any) {
    console.error('Erro ao criar votação rápida no Supabase:', error);
    throw new Error(error.message || 'Não foi possível criar a votação.');
  }
}

export async function getTeacherQuickVotes(): Promise<QuickVoteSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('quick_votes')
      .select(`
        *,
        subjects(name, grade),
        quick_vote_votes(score)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((vote: any) => {
      const votes = vote.quick_vote_votes || [];
      const totalVotes = votes.length;
      const averageScore = totalVotes > 0 
        ? Number((votes.reduce((sum: number, v: any) => sum + v.score, 0) / totalVotes).toFixed(2)) 
        : 0;

      return {
        id: Number(vote.id),
        publicHash: vote.public_hash,
        title: vote.title,
        subjectId: Number(vote.subject_id),
        subjectName: vote.subjects.name,
        subjectGrade: vote.subjects.grade,
        validationMode: vote.validation_mode,
        status: vote.status,
        createdAt: vote.created_at,
        closedAt: vote.closed_at,
        totalVotes,
        averageScore,
        sharePath: `/votar/${vote.public_hash}`,
        shareUrl: `${window.location.origin}/votar/${vote.public_hash}`
      };
    });
  } catch (error: any) {
    console.error('Erro ao buscar votações rápidas do professor no Supabase:', error);
    throw new Error(error.message || 'Não foi possível buscar as votações.');
  }
}

export async function getQuickVoteLivePanel(quickVoteId: number): Promise<QuickVoteLivePanel> {
  try {
    const { data: vote, error: voteError } = await supabase
      .from('quick_votes')
      .select(`
        *,
        subjects(name, grade)
      `)
      .eq('id', quickVoteId)
      .single();

    if (voteError) throw voteError;

    const { data: votes, error: votesError } = await supabase
      .from('quick_vote_votes')
      .select('id, student_name, score, voted_at')
      .eq('quick_vote_id', quickVoteId)
      .order('voted_at', { ascending: false });

    if (votesError) throw votesError;

    const totalVotes = votes?.length || 0;
    const averageScore = totalVotes > 0 
      ? Number(((votes || []).reduce((sum, v) => sum + v.score, 0) / totalVotes).toFixed(2)) 
      : 0;

    const distribution = Array.from({ length: 11 }, (_, score) => ({
      score,
      votes: (votes || []).filter(v => v.score === score).length
    }));

    return {
      quickVote: {
        id: Number(vote.id),
        publicHash: vote.public_hash,
        title: vote.title,
        subjectId: Number(vote.subject_id),
        subjectName: vote.subjects.name,
        subjectGrade: vote.subjects.grade,
        validationMode: vote.validation_mode,
        status: vote.status,
        createdAt: vote.created_at,
        closedAt: vote.closed_at,
        sharePath: `/votar/${vote.public_hash}`,
        shareUrl: `${window.location.origin}/votar/${vote.public_hash}`
      },
      totalVotes,
      averageScore,
      distribution,
      votes: (votes || []).map((v: any) => ({
        id: Number(v.id),
        studentName: v.student_name,
        score: Number(v.score),
        votedAt: v.voted_at
      }))
    };
  } catch (error: any) {
    console.error('Erro ao obter painel ao vivo no Supabase:', error);
    throw new Error(error.message || 'Não foi possível carregar o painel ao vivo.');
  }
}

export async function updateQuickVoteStatus(quickVoteId: number, status: QuickVoteStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from('quick_votes')
      .update({
        status,
        closed_at: status === 'closed' ? new Date().toISOString() : null
      })
      .eq('id', quickVoteId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erro ao fechar votação rápida no Supabase:', error);
    throw new Error(error.message || 'Não foi possível atualizar o status da votação.');
  }
}

export async function getPublicQuickVoteByHash(hash: string): Promise<QuickVoteSession> {
  try {
    const { data, error } = await supabase
      .from('quick_votes')
      .select(`
        *,
        subjects(name, grade)
      `)
      .eq('public_hash', hash)
      .single();

    if (error) throw error;

    return {
      id: Number(data.id),
      publicHash: data.public_hash,
      title: data.title,
      subjectId: Number(data.subject_id),
      subjectName: data.subjects.name,
      subjectGrade: data.subjects.grade,
      validationMode: data.validation_mode,
      status: data.status,
      createdAt: data.created_at,
      closedAt: data.closed_at,
      sharePath: `/votar/${data.public_hash}`,
      shareUrl: `${window.location.origin}/votar/${data.public_hash}`
    };
  } catch (error: any) {
    console.error('Erro ao buscar votação pública por hash no Supabase:', error);
    throw new Error(error.message || 'Votação não encontrada.');
  }
}

export async function submitPublicQuickVote(hash: string, payload: {
  studentName: string;
  score: number;
}): Promise<void> {
  try {
    const quickVote = await getPublicQuickVoteByHash(hash);

    if (quickVote.status !== 'active') {
      throw new Error('Esta votação já está encerrada.');
    }

    const studentNameKey = normalizeStudentName(payload.studentName);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('quick_vote_votes')
      .insert({
        quick_vote_id: quickVote.id,
        student_id: user?.id || null,
        student_name: payload.studentName,
        student_name_key: studentNameKey,
        score: payload.score
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Você ou alguém com este nome já votou nesta votação.');
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao enviar voto rápido no Supabase:', error);
    throw new Error(error.message || 'Não foi possível registrar o seu voto.');
  }
}
