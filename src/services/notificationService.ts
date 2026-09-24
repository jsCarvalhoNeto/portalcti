import { supabase } from '@/lib/supabaseClient';

export type NotificationSenderRole = 'admin' | 'teacher' | 'system';
export type NotificationTargetAudience = 
  | 'all' 
  | 'students' 
  | 'teachers' 
  | 'grade_1' 
  | 'grade_2' 
  | 'grade_3' 
  | 'subject_enrolled';

export type NotificationBannerStyle = 'emerald' | 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
export type NotificationPriority = 'normal' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  sender_id?: string | null;
  sender_name: string;
  sender_role: NotificationSenderRole;
  subject_id?: string | null;
  subject_name?: string | null;
  target_audience: NotificationTargetAudience;
  title: string;
  message: string;
  badge_text: string;
  action_url?: string | null;
  action_label?: string | null;
  banner_style: NotificationBannerStyle;
  priority: NotificationPriority;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Campos locais / computados
  is_read?: boolean;
  is_dismissed?: boolean;
}

export interface CreateNotificationInput {
  sender_id?: string | null;
  sender_name: string;
  sender_role: NotificationSenderRole;
  subject_id?: string | null;
  subject_name?: string | null;
  target_audience: NotificationTargetAudience;
  title: string;
  message: string;
  badge_text?: string;
  action_url?: string | null;
  action_label?: string | null;
  banner_style?: NotificationBannerStyle;
  priority?: NotificationPriority;
  expires_at: string;
}

const LOCAL_STORAGE_NOTIFS_KEY = 'cti_notifications_cache';
const LOCAL_STORAGE_DISMISSED_KEY = 'cti_notifications_dismissed';

// Mock inicial inteligente caso o banco ainda esteja vazio ou em migração
const INITIAL_MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'mock-shirt-notif',
    sender_name: 'Coordenação do Curso',
    sender_role: 'admin',
    target_audience: 'students',
    title: 'Já informou o tamanho da sua camisa do curso?',
    message: 'Informe se prefere o modelo Masculino ou Feminina e seu tamanho (P, M, G, GG ou XGG) para garantirmos a produção da sua camisa.',
    badge_text: 'Censo Oficial',
    action_url: '/camisas',
    action_label: 'Informar Meu Tamanho',
    banner_style: 'emerald',
    priority: 'high',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

function getLocalNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Salva o mock inicial se vazio
    localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
    return INITIAL_MOCK_NOTIFICATIONS;
  } catch {
    return INITIAL_MOCK_NOTIFICATIONS;
  }
}

function saveLocalNotifications(list: NotificationItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar notificações no localStorage:', e);
  }
}

function getDismissedNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissedNotificationId(id: string) {
  try {
    const current = getDismissedNotificationIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('Erro ao salvar notificação dispensada:', e);
  }
}

function clearDismissedNotificationId(id: string) {
  try {
    const current = getDismissedNotificationIds();
    const updated = current.filter(item => item !== id);
    localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao limpar dispensa:', e);
  }
}

/**
 * Busca notificações ativas para o aluno considerando prazos de expiração e público
 */
export async function getActiveNotificationsForStudent(params?: {
  studentId?: string;
  grade?: string;
  enrolledSubjectIds?: string[];
}): Promise<NotificationItem[]> {
  const nowIso = new Date().toISOString();
  const dismissedIds = getDismissedNotificationIds();

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false });

    if (error || !data) {
      throw error || new Error('Sem dados no Supabase');
    }

    // Filtrar público e dispensas
    return (data as NotificationItem[]).filter(n => {
      if (dismissedIds.includes(n.id)) return false;
      if (n.target_audience === 'all' || n.target_audience === 'students') return true;
      if (params?.grade) {
        if (n.target_audience === 'grade_1' && params.grade.includes('1')) return true;
        if (n.target_audience === 'grade_2' && params.grade.includes('2')) return true;
        if (n.target_audience === 'grade_3' && params.grade.includes('3')) return true;
      }
      if (n.target_audience === 'subject_enrolled' && n.subject_id && params?.enrolledSubjectIds) {
        return params.enrolledSubjectIds.includes(n.subject_id);
      }
      return false;
    });
  } catch (err) {
    console.info('Usando armazenamento local para notificações do aluno:', err);
    const local = getLocalNotifications();
    return local.filter(n => {
      const isNotExpired = new Date(n.expires_at).getTime() > Date.now();
      const isActive = n.is_active;
      const isNotDismissed = !dismissedIds.includes(n.id);
      if (!isNotExpired || !isActive || !isNotDismissed) return false;

      if (n.target_audience === 'all' || n.target_audience === 'students') return true;
      if (params?.grade) {
        if (n.target_audience === 'grade_1' && params.grade.includes('1')) return true;
        if (n.target_audience === 'grade_2' && params.grade.includes('2')) return true;
        if (n.target_audience === 'grade_3' && params.grade.includes('3')) return true;
      }
      if (n.target_audience === 'subject_enrolled' && n.subject_id && params?.enrolledSubjectIds) {
        return params.enrolledSubjectIds.includes(n.subject_id);
      }
      return false;
    });
  }
}

/**
 * Busca todas as notificações gerenciadas pelo professor
 */
export async function getTeacherNotifications(teacherId?: string): Promise<NotificationItem[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (teacherId) {
      query = query.eq('sender_id', teacherId);
    } else {
      query = query.eq('sender_role', 'teacher');
    }

    const { data, error } = await query;
    if (error || !data) throw error;
    return data as NotificationItem[];
  } catch (err) {
    console.info('Usando armazenamento local para notificações do professor:', err);
    const local = getLocalNotifications();
    if (!teacherId) {
      return local.filter(n => n.sender_role === 'teacher');
    }
    return local.filter(n => n.sender_id === teacherId || n.sender_role === 'teacher');
  }
}

/**
 * Busca todas as notificações (para o Admin)
 */
export async function getAllNotificationsForAdmin(): Promise<NotificationItem[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) throw error;
    return data as NotificationItem[];
  } catch (err) {
    return getLocalNotifications();
  }
}

/**
 * Cria uma nova notificação
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationItem> {
  const newItem: NotificationItem = {
    id: crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`,
    sender_id: input.sender_id || null,
    sender_name: input.sender_name || 'Professor',
    sender_role: input.sender_role,
    subject_id: input.subject_id || null,
    subject_name: input.subject_name || null,
    target_audience: input.target_audience,
    title: input.title,
    message: input.message,
    badge_text: input.badge_text || (input.sender_role === 'teacher' ? 'Aviso do Professor' : 'Aviso Oficial'),
    action_url: input.action_url || null,
    action_label: input.action_label || null,
    banner_style: input.banner_style || 'emerald',
    priority: input.priority || 'normal',
    expires_at: input.expires_at,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([newItem])
      .select()
      .single();

    if (error || !data) throw error;
    
    // Atualiza local também
    const local = getLocalNotifications();
    saveLocalNotifications([data as NotificationItem, ...local.filter(i => i.id !== data.id)]);
    return data as NotificationItem;
  } catch (err) {
    console.info('Salvando notificação localmente:', err);
    const local = getLocalNotifications();
    saveLocalNotifications([newItem, ...local]);
    return newItem;
  }
}

/**
 * Atualiza uma notificação existente (título, texto, tempo limite, etc.)
 */
export async function updateNotification(
  id: string,
  updates: Partial<Omit<NotificationItem, 'id' | 'created_at'>>
): Promise<NotificationItem> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error;

    const local = getLocalNotifications();
    const updatedList = local.map(n => n.id === id ? { ...n, ...data } : n);
    saveLocalNotifications(updatedList);
    return data as NotificationItem;
  } catch (err) {
    const local = getLocalNotifications();
    let updatedItem: NotificationItem | null = null;
    const updatedList = local.map(n => {
      if (n.id === id) {
        updatedItem = { ...n, ...payload };
        return updatedItem;
      }
      return n;
    });
    saveLocalNotifications(updatedList);
    if (!updatedItem) throw new Error('Notificação não encontrada');
    return updatedItem;
  }
}

/**
 * Reenvia uma notificação: atualiza created_at para now() e limpa as dispensas
 * para que volte a aparecer como destaque no topo para todos os alunos
 */
export async function resendNotification(id: string, newExpiresAt?: string): Promise<NotificationItem> {
  const nowIso = new Date().toISOString();
  const updates: Partial<NotificationItem> = {
    created_at: nowIso,
    updated_at: nowIso,
    is_active: true
  };

  if (newExpiresAt) {
    updates.expires_at = newExpiresAt;
  }

  // Limpar a dispensa local
  clearDismissedNotificationId(id);

  try {
    // Também limpa na tabela notification_reads
    await supabase.from('notification_reads').delete().eq('notification_id', id);

    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error;

    const local = getLocalNotifications();
    const updatedList = local.map(n => n.id === id ? { ...n, ...data } : n);
    saveLocalNotifications(updatedList);
    return data as NotificationItem;
  } catch (err) {
    const local = getLocalNotifications();
    let updatedItem: NotificationItem | null = null;
    const updatedList = local.map(n => {
      if (n.id === id) {
        updatedItem = { ...n, ...updates };
        return updatedItem;
      }
      return n;
    });
    saveLocalNotifications(updatedList);
    if (!updatedItem) throw new Error('Notificação não encontrada');
    return updatedItem;
  }
}

/**
 * Exclui uma notificação
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    const local = getLocalNotifications();
    saveLocalNotifications(local.filter(n => n.id !== id));
    return true;
  } catch (err) {
    const local = getLocalNotifications();
    saveLocalNotifications(local.filter(n => n.id !== id));
    return true;
  }
}

/**
 * Aluno dispensa o banner de uma notificação
 */
export async function dismissNotification(notificationId: string, studentId?: string): Promise<void> {
  addDismissedNotificationId(notificationId);

  if (studentId) {
    try {
      await supabase
        .from('notification_reads')
        .upsert({
          notification_id: notificationId,
          user_id: studentId,
          read_at: new Date().toISOString(),
          dismissed_at: new Date().toISOString()
        });
    } catch (e) {
      // Ignora erro remoto caso offline
    }
  }
}

/**
 * Gatilho Automático: Dispara notificação quando uma nova atividade com prazo é cadastrada
 */
export async function dispatchActivityNotification(params: {
  activityName: string;
  subjectId?: string;
  subjectName?: string;
  dueDate: string;
  teacherId?: string;
  teacherName?: string;
  actionUrl?: string;
}): Promise<NotificationItem> {
  const formattedDate = new Date(params.dueDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return createNotification({
    sender_id: params.teacherId || null,
    sender_name: params.teacherName || 'Professor da Disciplina',
    sender_role: 'teacher',
    subject_id: params.subjectId || null,
    subject_name: params.subjectName || null,
    target_audience: params.subjectId ? 'subject_enrolled' : 'students',
    badge_text: 'Nova Atividade',
    title: `${params.subjectName ? `[${params.subjectName}] ` : ''}Nova atividade: ${params.activityName}`,
    message: `Uma nova atividade foi lançada com prazo final de entrega até ${formattedDate}. Não deixe para a última hora!`,
    action_label: 'Ver Atividade',
    action_url: params.actionUrl || '/student?tab=grades',
    banner_style: 'teal',
    priority: 'high',
    expires_at: params.dueDate // O tempo limite é o próprio prazo de entrega!
  });
}
