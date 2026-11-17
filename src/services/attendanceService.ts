import { supabase } from '@/lib/supabaseClient';
import { ATTENDANCE_POINTS_DEFAULT, awardAttendance } from './gamificationService';

export interface AttendanceSession {
  id: string;
  code: string;
  teacher_id: string;
  subject_id: number | null;
  lesson_id: string | null;
  title: string;
  points_reward: number;
  is_active: boolean;
  expires_at: string;
  closed_at: string | null;
  created_at: string;
  subject_name?: string;
  records_count?: number;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  subject_id: number | null;
  points_awarded: number;
  status: 'present' | 'late' | 'excused';
  checked_in_at: string;
  recorded_by: string | null;
  student_name?: string;
  student_email?: string;
  student_grade?: string;
}

export interface CreateAttendanceSessionInput {
  teacherId: string;
  title: string;
  subjectId?: number | string | null;
  lessonId?: string | null;
  durationMinutes?: number;
  pointsReward?: number;
}

export interface CheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  pointsAwarded: number;
  message: string;
  session?: AttendanceSession;
}

function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const attendanceService = {
  /**
   * Cria uma nova sessão de chamada com código único de 6 dígitos
   */
  async createSession(input: CreateAttendanceSessionInput): Promise<AttendanceSession> {
    const durationMinutes = Math.max(1, Number(input.durationMinutes || 15));
    const pointsReward = Number(input.pointsReward ?? ATTENDANCE_POINTS_DEFAULT);
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const numericSubjectId =
      input.subjectId !== undefined && input.subjectId !== null && input.subjectId !== '' && input.subjectId !== 'none'
        ? Number(input.subjectId)
        : null;

    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateSixDigitCode();
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          code,
          teacher_id: input.teacherId,
          subject_id: numericSubjectId,
          lesson_id: input.lessonId || null,
          title: input.title.trim(),
          points_reward: pointsReward,
          is_active: true,
          expires_at: expiresAt,
        })
        .select('*')
        .single();

      if (!error && data) {
        return data as AttendanceSession;
      }

      lastError = error;
      // Se não for colisão de código único, interrompe
      if (error?.code !== '23505') {
        break;
      }
    }

    throw new Error(lastError?.message || 'Não foi possível criar a sessão de chamada.');
  },

  /**
   * Lista sessões recentes do professor
   */
  async getTeacherSessions(teacherId: string, subjectId?: number | string): Promise<AttendanceSession[]> {
    let query = supabase
      .from('attendance_sessions')
      .select(`
        *,
        subjects ( name ),
        attendance_records ( id )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (subjectId) {
      query = query.eq('subject_id', Number(subjectId));
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Erro ao buscar histórico de chamadas.');
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      teacher_id: row.teacher_id,
      subject_id: row.subject_id,
      lesson_id: row.lesson_id,
      title: row.title,
      points_reward: Number(row.points_reward ?? ATTENDANCE_POINTS_DEFAULT),
      is_active: Boolean(row.is_active),
      expires_at: row.expires_at,
      closed_at: row.closed_at,
      created_at: row.created_at,
      subject_name: row.subjects?.name || undefined,
      records_count: Array.isArray(row.attendance_records) ? row.attendance_records.length : 0,
    }));
  },

  /**
   * Busca uma sessão de chamada pelo código de 6 dígitos
   */
  async getSessionByCode(code: string): Promise<AttendanceSession | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        subjects ( name )
      `)
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Erro ao localizar código de chamada.');
    }

    if (!data) return null;

    return {
      id: data.id,
      code: data.code,
      teacher_id: data.teacher_id,
      subject_id: data.subject_id,
      lesson_id: data.lesson_id,
      title: data.title,
      points_reward: Number(data.points_reward ?? ATTENDANCE_POINTS_DEFAULT),
      is_active: Boolean(data.is_active),
      expires_at: data.expires_at,
      closed_at: data.closed_at,
      created_at: data.created_at,
      subject_name: (data as any).subjects?.name || undefined,
    };
  },

  /**
   * Lista os alunos presentes em uma sessão
   */
  async getSessionRecords(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .order('checked_in_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Erro ao buscar lista de presença.');
    }

    const rows = data || [];
    if (rows.length === 0) return [];

    const studentIds = Array.from(new Set(rows.map((r: any) => r.student_id).filter(Boolean)));
    let profileMap: Record<string, { full_name?: string; email?: string; grade?: string }> = {};

    if (studentIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, grade')
        .in('id', studentIds);

      if (profilesData) {
        profileMap = Object.fromEntries(
          profilesData.map((p: any) => [
            p.id,
            { full_name: p.full_name, email: p.email, grade: p.grade },
          ])
        );
      }
    }

    return rows.map((r: any) => ({
      id: r.id,
      session_id: r.session_id,
      student_id: r.student_id,
      subject_id: r.subject_id,
      points_awarded: Number(r.points_awarded ?? ATTENDANCE_POINTS_DEFAULT),
      status: r.status || 'present',
      checked_in_at: r.checked_in_at,
      recorded_by: r.recorded_by,
      student_name: profileMap[r.student_id]?.full_name || 'Aluno',
      student_email: profileMap[r.student_id]?.email || '',
      student_grade: profileMap[r.student_id]?.grade || '',
    }));
  },

  /**
   * Encerra uma sessão de chamada
   */
  async closeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_sessions')
      .update({
        is_active: false,
        closed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(error.message || 'Erro ao encerrar chamada.');
    }
  },

  /**
   * Reabre ou prorroga uma sessão de chamada por mais X minutos
   */
  async extendSession(sessionId: string, extraMinutes: number = 10): Promise<AttendanceSession> {
    const newExpiresAt = new Date(Date.now() + extraMinutes * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('attendance_sessions')
      .update({
        is_active: true,
        closed_at: null,
        expires_at: newExpiresAt,
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao prorrogar chamada.');
    }

    return data as AttendanceSession;
  },

  /**
   * Registra a presença do aluno pelo código e credita +20 pontos na gamificação
   */
  async checkInByCode(code: string, studentId: string): Promise<CheckInResult> {
    const session = await this.getSessionByCode(code);
    if (!session) {
      return {
        success: false,
        pointsAwarded: 0,
        message: 'Código de chamada não encontrado. Verifique os dígitos informados.',
      };
    }

    // Verificar se já registrou presença antes mesmo de checar expiração
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id, points_awarded')
      .eq('session_id', session.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingRecord) {
      return {
        success: true,
        alreadyCheckedIn: true,
        pointsAwarded: 0,
        message: 'Sua presença já foi registrada nesta aula anteriormente.',
        session,
      };
    }

    if (!session.is_active || new Date(session.expires_at).getTime() <= Date.now()) {
      return {
        success: false,
        pointsAwarded: 0,
        message: 'Esta chamada já foi encerrada ou o tempo limite expirou.',
        session,
      };
    }

    // Se a chamada estiver vinculada a uma disciplina, verificar matrícula
    if (session.subject_id) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('subject_id', Number(session.subject_id))
        .maybeSingle();

      if (!enrollment) {
        return {
          success: false,
          pointsAwarded: 0,
          message: 'Você não está matriculado nesta disciplina para registrar presença.',
          session,
        };
      }
    }

    const pointsToAward = Number(session.points_reward ?? ATTENDANCE_POINTS_DEFAULT);

    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: session.id,
        student_id: studentId,
        subject_id: session.subject_id,
        points_awarded: pointsToAward,
        status: 'present',
        recorded_by: studentId,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return {
          success: true,
          alreadyCheckedIn: true,
          pointsAwarded: 0,
          message: 'Sua presença já havia sido registrada nesta chamada.',
          session,
        };
      }
      throw new Error(insertError.message || 'Erro ao registrar presença.');
    }

    const awardRes = await awardAttendance(
      studentId,
      session.id,
      pointsToAward,
      session.subject_id
    );

    const awarded = awardRes?.awarded ?? pointsToAward;

    return {
      success: true,
      alreadyCheckedIn: false,
      pointsAwarded: awarded,
      message:
        awarded > 0
          ? `Presença confirmada! Você ganhou +${awarded} pontos na gamificação.`
          : 'Presença confirmada!',
      session,
    };
  },

  /**
   * Permite ao professor marcar manualmente um aluno presente e creditar os 20 pontos
   */
  async markStudentManually(
    session: AttendanceSession,
    studentId: string,
    teacherId: string
  ): Promise<{ alreadyPresent: boolean; pointsAwarded: number }> {
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      return { alreadyPresent: true, pointsAwarded: 0 };
    }

    const pointsToAward = Number(session.points_reward ?? ATTENDANCE_POINTS_DEFAULT);

    const { error } = await supabase
      .from('attendance_records')
      .insert({
        session_id: session.id,
        student_id: studentId,
        subject_id: session.subject_id,
        points_awarded: pointsToAward,
        status: 'present',
        recorded_by: teacherId,
      });

    if (error) {
      if (error.code === '23505') {
        return { alreadyPresent: true, pointsAwarded: 0 };
      }
      throw new Error(error.message || 'Erro ao marcar presença manual.');
    }

    const awardRes = await awardAttendance(
      studentId,
      session.id,
      pointsToAward,
      session.subject_id
    );

    return {
      alreadyPresent: false,
      pointsAwarded: awardRes?.awarded ?? pointsToAward,
    };
  },

  /**
   * Remove um registro de presença (caso tenha sido marcado por engano)
   */
  async removeRecord(recordId: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      throw new Error(error.message || 'Erro ao remover registro de presença.');
    }
  },

  /**
   * Histórico de presenças do aluno logado
   */
  async getStudentAttendanceHistory(studentId: string): Promise<
    Array<{
      id: string;
      checked_in_at: string;
      points_awarded: number;
      session_title: string;
      subject_name?: string;
      code: string;
    }>
  > {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        checked_in_at,
        points_awarded,
        attendance_sessions (
          title,
          code,
          subjects ( name )
        )
      `)
      .eq('student_id', studentId)
      .order('checked_in_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Erro ao buscar histórico de presenças do aluno:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      checked_in_at: row.checked_in_at,
      points_awarded: Number(row.points_awarded ?? ATTENDANCE_POINTS_DEFAULT),
      session_title: row.attendance_sessions?.title || 'Aula',
      subject_name: row.attendance_sessions?.subjects?.name || undefined,
      code: row.attendance_sessions?.code || '',
    }));
  },
};

export default attendanceService;
