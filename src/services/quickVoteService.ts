import api from '@/services/api';

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

interface ApiEnvelope<T> {
  success: boolean;
  error?: string;
  message?: string;
  quickVote?: T;
  quickVotes?: T[];
  panel?: QuickVoteLivePanel;
  vote?: unknown;
}

export async function createQuickVote(payload: {
  title: string;
  subjectId: number;
  validationMode?: 'public_name' | 'session_if_available' | 'session_required';
}): Promise<QuickVoteSession> {
  const response = await api.post<ApiEnvelope<QuickVoteSession>>('/quick-votes', payload);
  if (!response.data.success || !response.data.quickVote) {
    throw new Error(response.data.error || 'Nao foi possivel criar a votacao.');
  }
  return response.data.quickVote;
}

export async function getTeacherQuickVotes(): Promise<QuickVoteSession[]> {
  const response = await api.get<ApiEnvelope<QuickVoteSession>>('/quick-votes');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Nao foi possivel listar as votacoes.');
  }
  return response.data.quickVotes || [];
}

export async function getQuickVoteLivePanel(quickVoteId: number): Promise<QuickVoteLivePanel> {
  const response = await api.get<ApiEnvelope<QuickVoteSession>>(`/quick-votes/${quickVoteId}/live`);
  if (!response.data.success || !response.data.panel) {
    throw new Error(response.data.error || 'Nao foi possivel carregar o painel ao vivo.');
  }
  return response.data.panel;
}

export async function updateQuickVoteStatus(quickVoteId: number, status: QuickVoteStatus): Promise<void> {
  const response = await api.patch<ApiEnvelope<never>>(`/quick-votes/${quickVoteId}/status`, { status });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Nao foi possivel atualizar o status da votacao.');
  }
}

export async function getPublicQuickVoteByHash(hash: string): Promise<QuickVoteSession> {
  const response = await api.get<ApiEnvelope<QuickVoteSession>>(`/quick-votes/public/${hash}`);
  if (!response.data.success || !response.data.quickVote) {
    throw new Error(response.data.error || 'Votacao nao encontrada.');
  }
  return response.data.quickVote;
}

export async function submitPublicQuickVote(hash: string, payload: {
  studentName: string;
  score: number;
}): Promise<void> {
  const response = await api.post<ApiEnvelope<never>>(`/quick-votes/public/${hash}/vote`, payload);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Nao foi possivel registrar o voto.');
  }
}
