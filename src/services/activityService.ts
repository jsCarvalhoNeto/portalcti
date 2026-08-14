import { supabase } from '../lib/supabaseClient';

export interface ActivityFileItem {
  file_name: string;
  file_url: string;
  file_path: string;
}

export interface ActivityData {
  name: string;
  subject_id: number;
  grade?: string; // Opcional - o controller pega a série da disciplina
  type: 'individual' | 'team';
  description?: string;
  file_path?: string;
  file_name?: string;
  files?: File[] | ActivityFileItem[];
  rawFiles?: File[];
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface ActivityGradeData {
  activity_id: number;
  enrollment_id: number;
  grade: number;
  graded_by: string;
}

export interface StudentActivityFile {
  enrollment_id: number;
  file_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_uploaded_at: string;
}

export interface ActivityGrade {
  grade_id?: number; // Adicionado para identificação única da nota
  id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  activity_id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  enrollment_id: number;
  student_id: string;
  grade: number | null;
  graded_at: string | null;
  graded_by: string | null;
  student_name: string | null; // Nome do aluno na submissão
  team_members: string | null;
  file_path: string | null;
  file_name: string | null;
  files?: StudentActivityFile[]; // Novo: array de arquivos enviados pelo aluno
  text_submission?: string | null;
  submitted_at: string | null; // Pode ser nulo para alunos que ainda não submeteram (usando graded_at como timestamp de submissão)
  status: 'graded' | 'submitted' | 'pending';
  student_name_display: string;
  student_email: string;
  subject_name: string;
  activity_name: string;
  teacher_name?: string; // Adicionado para mostrar o nome do professor
  teacher_observation?: string | null; // Observação em rich text HTML enviada pelo professor
  has_teacher_observation?: boolean;
  
  // 🎯 Campos para sistema de equipes
  auto_applied?: boolean; // Indica se a nota foi aplicada automaticamente para membro de equipe
  team_leader_grade_id?: number | null; // ID da nota original do líder da equipe
  manual_grade?: boolean; // Indica se a nota foi atribuída manualmente pelo professor
}

export interface StudentActivity {
  id: number;
  name: string;
  subject_id?: number;
  subject_name: string;
  teacher_name: string;
  type: 'individual' | 'team';
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  deadline?: string | null;
  period?: string | null;
  evaluation_type?: string | null;
  status: 'pending' | 'submitted' | 'completed';
  student_grade?: number | string | null;
  grade?: number | null;
  grade_date?: string | null;
  submitted_at?: string | null;
  teacher_observation?: string | null;
}

export async function uploadActivityFile(file: File, folder: string = 'activities'): Promise<{ fileName: string; filePath: string; publicUrl: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${Date.now()}_${sanitizedName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('activities')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Erro no upload para o Supabase Storage:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('activities')
    .getPublicUrl(path);

  return {
    fileName: file.name,
    filePath: path,
    publicUrl: publicUrl
  };
}

export async function createActivity(activityData: ActivityData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    let grade = activityData.grade;
    if (!grade) {
      const { data: sub } = await supabase
        .from('subjects')
        .select('grade')
        .eq('id', activityData.subject_id)
        .single();
      grade = sub?.grade || '';
    }

    let filesList: ActivityFileItem[] = [];
    let mainFilePath = activityData.file_path || null;
    let mainFileName = activityData.file_name || null;

    const filesToUpload = activityData.rawFiles || (Array.isArray(activityData.files) && activityData.files.length > 0 && activityData.files[0] instanceof File ? (activityData.files as File[]) : []);

    if (filesToUpload && filesToUpload.length > 0) {
      for (const file of filesToUpload) {
        try {
          const uploaded = await uploadActivityFile(file, `teacher_${user.id}`);
          filesList.push({
            file_name: uploaded.fileName,
            file_path: uploaded.filePath,
            file_url: uploaded.publicUrl
          });
        } catch (upErr) {
          console.error('Erro no upload de arquivo:', upErr);
        }
      }
      if (filesList.length > 0) {
        mainFilePath = filesList[0].file_url || filesList[0].file_path;
        mainFileName = filesList[0].file_name;
      }
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        name: activityData.name,
        subject_id: activityData.subject_id,
        grade: grade,
        type: activityData.type,
        description: activityData.description || null,
        deadline: activityData.deadline || null,
        period: activityData.period || null,
        evaluation_type: activityData.evaluation_type || null,
        file_path: mainFilePath,
        file_name: mainFileName,
        files: filesList,
        teacher_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao criar atividade no Supabase:', error);
    throw new Error(error.message || 'Não foi possível criar a atividade.');
  }
}

export async function getAvailableStudentsForActivity(activityId: number) {
  try {
    const { data: act, error: actErr } = await supabase
      .from('activities')
      .select('subject_id')
      .eq('id', activityId)
      .single();

    if (actErr || !act) throw actErr || new Error('Atividade não encontrada');

    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    const studentIds = (studentRoles || []).map(r => r.user_id);
    if (studentIds.length === 0) return [];

    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        profiles!inner(
          id,
          full_name,
          email,
          student_registration,
          grade
        )
      `)
      .eq('subject_id', act.subject_id)
      .in('student_id', studentIds);

    if (enrollErr) throw enrollErr;

    const { data: grades } = await supabase
      .from('activity_grades')
      .select('enrollment_id')
      .eq('activity_id', activityId);

    const gradedEnrollmentIds = new Set((grades || []).map(g => Number(g.enrollment_id)));

    if (!enrollments || enrollments.length === 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, email, student_registration, grade')
        .in('id', studentIds);

      return (students || []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        email: s.email || '',
        student_registration: s.student_registration || '',
        grade: s.grade || '',
        already_has_grade: false
      }));
    }

    return enrollments.map((item: any) => ({
      id: item.profiles.id,
      enrollment_id: Number(item.id),
      full_name: item.profiles.full_name,
      email: item.profiles.email || '',
      student_registration: item.profiles.student_registration || '',
      grade: item.profiles.grade || '',
      already_has_grade: gradedEnrollmentIds.has(Number(item.id))
    }));
  } catch (error) {
    console.error('Erro ao buscar alunos disponíveis no Supabase:', error);
    return [];
  }
}

export async function getEnrollmentForActivityStudent(activityId: number, studentId: string) {
  try {
    const { data: act } = await supabase
      .from('activities')
      .select('subject_id')
      .eq('id', activityId)
      .single();

    if (!act) throw new Error('Atividade não encontrada');

    let { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('subject_id', act.subject_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      const { data: newEnrollment, error: createError } = await supabase
        .from('enrollments')
        .insert({
          subject_id: act.subject_id,
          student_id: studentId,
          enrollment_date: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) throw createError;
      enrollment = newEnrollment;
    }

    return { enrollment_id: Number(enrollment.id) };
  } catch (error) {
    console.error('Erro ao obter matrícula do aluno:', error);
    throw error;
  }
}

export async function assignActivityGrade(gradeData: ActivityGradeData) {
  try {
    const { data: existing } = await supabase
      .from('activity_grades')
      .select('id')
      .eq('activity_id', gradeData.activity_id)
      .eq('enrollment_id', gradeData.enrollment_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('activity_grades')
        .update({
          grade: gradeData.grade,
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('activity_grades')
        .insert({
          activity_id: gradeData.activity_id,
          enrollment_id: gradeData.enrollment_id,
          grade: gradeData.grade,
          status: 'graded',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } catch (error: any) {
    console.error('Erro ao atribuir nota de atividade no Supabase:', error);
    throw new Error(error.message || 'Não foi possível atribuir a nota à atividade.');
  }
}

export async function getActivityGrades(activityId: number): Promise<ActivityGrade[]> {
  try {
    const { data, error } = await supabase
      .from('activity_grades')
      .select(`
        id,
        activity_id,
        enrollment_id,
        grade,
        submitted_at,
        student_name,
        team_members,
        text_submission,
        file_path,
        file_name,
        files,
        status,
        teacher_observation,
        enrollments!inner(
          student_id,
          profiles!inner(full_name, email)
        )
      `)
      .eq('activity_id', activityId);

    if (error) throw error;

    return (data || []).map((grade: any) => ({
      grade_id: Number(grade.id),
      id: Number(grade.id),
      activity_id: Number(grade.activity_id),
      enrollment_id: Number(grade.enrollment_id),
      student_id: grade.enrollments.student_id,
      grade: grade.grade !== null && grade.grade !== undefined ? Number(grade.grade) : null,
      graded_at: grade.submitted_at,
      graded_by: null,
      student_name: grade.student_name || grade.enrollments.profiles.full_name,
      student_name_display: grade.student_name || grade.enrollments.profiles.full_name,
      student_email: grade.enrollments.profiles.email || '',
      subject_name: '',
      activity_name: '',
      team_members: grade.team_members || null,
      file_path: grade.file_path || null,
      file_name: grade.file_name || null,
      files: grade.files || [],
      text_submission: grade.text_submission || null,
      submitted_at: grade.submitted_at,
      status: grade.status || (grade.grade !== null ? 'graded' : 'submitted'),
      teacher_observation: grade.teacher_observation || null,
      has_teacher_observation: !!grade.teacher_observation
    }));
  } catch (error: any) {
    console.error('Erro ao buscar notas no Supabase:', error);
    throw new Error(error.message || 'Não foi possível buscar as notas da atividade.');
  }
}

export async function updateActivity(activityId: number, activityData: ActivityData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    let filesList: ActivityFileItem[] = Array.isArray(activityData.files) && activityData.files.length > 0 && !(activityData.files[0] instanceof File)
      ? (activityData.files as ActivityFileItem[])
      : [];
    let mainFilePath = activityData.file_path || null;
    let mainFileName = activityData.file_name || null;

    const filesToUpload = activityData.rawFiles || (Array.isArray(activityData.files) && activityData.files.length > 0 && activityData.files[0] instanceof File ? (activityData.files as File[]) : []);

    if (filesToUpload && filesToUpload.length > 0) {
      for (const file of filesToUpload) {
        try {
          const uploaded = await uploadActivityFile(file, `teacher_${user.id}`);
          filesList.push({
            file_name: uploaded.fileName,
            file_path: uploaded.filePath,
            file_url: uploaded.publicUrl
          });
        } catch (upErr) {
          console.error('Erro no upload de arquivo:', upErr);
        }
      }
      if (filesList.length > 0) {
        mainFilePath = filesList[0].file_url || filesList[0].file_path;
        mainFileName = filesList[0].file_name;
      }
    }

    const updatePayload: any = {
      name: activityData.name,
      type: activityData.type,
      description: activityData.description || null,
      deadline: activityData.deadline || null,
      period: activityData.period || null,
      evaluation_type: activityData.evaluation_type || null,
    };

    if (activityData.grade) {
      updatePayload.grade = activityData.grade;
    }
    if (mainFilePath) {
      updatePayload.file_path = mainFilePath;
    }
    if (mainFileName) {
      updatePayload.file_name = mainFileName;
    }
    if (filesList.length > 0) {
      updatePayload.files = filesList;
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updatePayload)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao atualizar atividade no Supabase:', error);
    throw new Error(error.message || 'Não foi possível atualizar a atividade.');
  }
}

export async function updateActivityGrade(gradeId: number, grade: number) {
  try {
    const { data, error } = await supabase
      .from('activity_grades')
      .update({ grade, status: 'graded', updated_at: new Date().toISOString() })
      .eq('id', gradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao atualizar nota no Supabase:', error);
    throw new Error(error.message || 'Não foi possível atualizar a nota da atividade.');
  }
}

export async function setActivityTeacherObservation(gradeId: number, teacher_observation: string | null) {
  try {
    const { data, error } = await supabase
      .from('activity_grades')
      .update({
        teacher_observation,
        updated_at: new Date().toISOString()
      })
      .eq('id', gradeId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar observação:', error);
    throw new Error('Não foi possível salvar a observação.');
  }
}

export async function deleteActivityGrade(gradeId: number) {
  try {
    const { error } = await supabase
      .from('activity_grades')
      .delete()
      .eq('id', gradeId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir nota no Supabase:', error);
    throw new Error(error.message || 'Não foi possível excluir a nota da atividade.');
  }
}

export interface ManualTeamGradeData {
  activity_id: number;
  enrollment_id: number;
  grade: number;
  teacher_observation?: string;
  student_name?: string;
}

export async function assignManualGradeToTeamMember(gradeData: ManualTeamGradeData) {
  try {
    return await assignActivityGrade({
      activity_id: gradeData.activity_id,
      enrollment_id: gradeData.enrollment_id,
      grade: gradeData.grade,
      graded_by: ''
    });
  } catch (error: any) {
    console.error('Erro ao atribuir nota manual no Supabase:', error);
    throw new Error(error.message || 'Não foi possível atribuir a nota manual.');
  }
}

export async function deleteActivity(activityId: number) {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar atividade no Supabase:', error);
    throw new Error(error.message || 'Não foi possível excluir atividade.');
  }
}

export async function getStudentActivities(): Promise<StudentActivity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Obter as matrículas do aluno logado
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('id, subject_id')
      .eq('student_id', user.id);

    const enrollmentMap = new Map<number, number>();
    (enrolls || []).forEach(e => enrollmentMap.set(Number(e.subject_id), Number(e.id)));

    const subjectIds = Array.from(enrollmentMap.keys());
    if (subjectIds.length === 0) return [];

    // 2. Buscar submissões existentes do aluno
    const enrollmentIds = (enrolls || []).map(e => e.id);
    const { data: userGrades } = await supabase
      .from('activity_grades')
      .select('activity_id, grade, status, submitted_at, teacher_observation')
      .in('enrollment_id', enrollmentIds);

    const gradeMap = new Map<number, {
      grade: number | null;
      status: string;
      submitted_at: string | null;
      teacher_observation: string | null;
    }>();
    
    (userGrades || []).forEach(g => {
      gradeMap.set(Number(g.activity_id), {
        grade: g.grade !== null && g.grade !== undefined ? Number(g.grade) : null,
        status: g.status || (g.grade !== null ? 'completed' : 'submitted'),
        submitted_at: g.submitted_at || null,
        teacher_observation: g.teacher_observation || null
      });
    });

    // 3. Buscar atividades associadas às matérias matriculadas
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        name,
        subject_id,
        type,
        description,
        file_path,
        file_name,
        deadline,
        period,
        evaluation_type,
        created_at,
        subjects!inner(
          name,
          teacher_id
        )
      `)
      .in('subject_id', subjectIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 4. Buscar nomes dos professores
    const teacherIds = Array.from(new Set((data || []).map((a: any) => a.subjects?.teacher_id).filter(Boolean)));
    const teacherMap = new Map<string, string>();
    if (teacherIds.length > 0) {
      const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds);
      (teacherProfiles || []).forEach((t: any) => teacherMap.set(t.id, t.full_name));
    }

    return (data || []).map((activity: any) => {
      const actId = Number(activity.id);
      const subInfo = gradeMap.get(actId);
      let status: 'pending' | 'submitted' | 'completed' = 'pending';
      if (subInfo) {
        if (subInfo.grade !== null && subInfo.grade !== undefined) {
          status = 'completed';
        } else {
          status = 'submitted';
        }
      }

      const teacherName = (activity.subjects?.teacher_id && teacherMap.get(activity.subjects.teacher_id)) || 'Professor';

      return {
        id: actId,
        subject_id: Number(activity.subject_id),
        name: activity.name,
        subject_name: activity.subjects?.name || 'Disciplina',
        teacher_name: teacherName,
        type: activity.type || 'individual',
        description: activity.description || null,
        file_path: activity.file_path || null,
        file_name: activity.file_name || null,
        created_at: activity.created_at,
        deadline: activity.deadline || null,
        period: activity.period || null,
        evaluation_type: activity.evaluation_type || null,
        status: status,
        student_grade: subInfo?.grade !== null && subInfo?.grade !== undefined ? subInfo.grade : null,
        grade: subInfo?.grade !== null && subInfo?.grade !== undefined ? subInfo.grade : null,
        grade_date: subInfo?.submitted_at || null,
        submitted_at: subInfo?.submitted_at || null,
        teacher_observation: subInfo?.teacher_observation || null
      };
    });
  } catch (error: any) {
    console.error('Erro ao obter atividades do estudante no Supabase:', error);
    throw new Error(error.message || 'Não foi possível buscar as atividades.');
  }
}

export async function submitStudentActivity(activityData: FormData): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const activityId = activityData.get('activity_id');
    if (!activityId) throw new Error('ID da atividade não informado');

    const studentName = (activityData.get('student_name') as string) || '';
    const teamMembers = (activityData.get('team_members') as string) || '';
    const textSubmission = (activityData.get('text_submission') as string) || '';

    // Coletar arquivos do FormData (seja 'files' ou 'file')
    const filesEntries: File[] = [];
    const filesGetAll = activityData.getAll('files');
    const fileGetAll = activityData.getAll('file');

    [...filesGetAll, ...fileGetAll].forEach((item) => {
      if (item instanceof File && item.name && item.size > 0) {
        filesEntries.push(item);
      }
    });

    if (!textSubmission.trim() && filesEntries.length === 0) {
      throw new Error('Informe o texto da submissão ou anexe ao menos um arquivo.');
    }

    // 1. Upload de arquivos se existirem para o bucket 'submissions'
    const filesList: StudentActivityFile[] = [];
    for (const file of filesEntries) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `submissions/${activityId}/${user.id}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload de arquivo da submissão:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      filesList.push({
        enrollment_id: 0,
        file_id: `${Date.now()}`,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type || 'application/octet-stream',
        file_uploaded_at: new Date().toISOString()
      });
    }

    // 2. Obter disciplina da atividade
    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .select('subject_id')
      .eq('id', Number(activityId))
      .single();

    if (actErr || !activity) throw actErr || new Error('Atividade não encontrada');

    // 3. Obter ou criar matrícula do aluno para essa disciplina
    let { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('subject_id', activity.subject_id)
      .maybeSingle();

    if (!enrollment) {
      const { data: newEnrollment, error: createError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          subject_id: activity.subject_id,
          enrollment_date: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) throw createError;
      enrollment = newEnrollment;
    }

    // Atualizar enrollment_id nos arquivos
    filesList.forEach(f => f.enrollment_id = Number(enrollment.id));

    // 4. Verificar se já existe submissão para atualizar ou inserir
    const { data: existingSubmission } = await supabase
      .from('activity_grades')
      .select('id, grade')
      .eq('activity_id', Number(activityId))
      .eq('enrollment_id', Number(enrollment.id))
      .maybeSingle();

    const submissionPayload = {
      activity_id: Number(activityId),
      enrollment_id: Number(enrollment.id),
      student_name: studentName || null,
      team_members: teamMembers || null,
      text_submission: textSubmission || null,
      file_path: filesList.length > 0 ? filesList[0].file_url : null,
      file_name: filesList.length > 0 ? filesList[0].file_name : null,
      files: filesList,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    let resultData;
    if (existingSubmission) {
      const { data, error } = await supabase
        .from('activity_grades')
        .update(submissionPayload)
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    } else {
      const { data, error } = await supabase
        .from('activity_grades')
        .insert({
          ...submissionPayload,
          grade: null
        })
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    }

    return resultData;
  } catch (error: any) {
    console.error('Erro ao submeter atividade no Supabase:', error);
    throw new Error(error.message || 'Não foi possível enviar a atividade.');
  }
}

export async function getStudentActivityGrades(): Promise<ActivityGrade[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id);

    const enrollmentIds = (enrolls || []).map(e => e.id);

    if (enrollmentIds.length === 0) return [];

    const { data, error } = await supabase
      .from('activity_grades')
      .select(`
        id,
        activity_id,
        enrollment_id,
        grade,
        submitted_at,
        student_name,
        team_members,
        text_submission,
        file_path,
        file_name,
        files,
        status,
        teacher_observation,
        activities!inner(
          name,
          subjects!inner(name)
        )
      `)
      .in('enrollment_id', enrollmentIds);

    if (error) throw error;

    return (data || []).map((grade: any) => ({
      grade_id: Number(grade.id),
      id: Number(grade.id),
      activity_id: Number(grade.activity_id),
      enrollment_id: Number(grade.enrollment_id),
      student_id: user.id,
      grade: grade.grade !== null && grade.grade !== undefined ? Number(grade.grade) : null,
      graded_at: grade.submitted_at,
      graded_by: null,
      student_name: grade.student_name || '',
      student_name_display: grade.student_name || '',
      student_email: '',
      subject_name: grade.activities?.subjects?.name || '',
      activity_name: grade.activities?.name || '',
      team_members: grade.team_members || null,
      file_path: grade.file_path || null,
      file_name: grade.file_name || null,
      files: grade.files || [],
      text_submission: grade.text_submission || null,
      submitted_at: grade.submitted_at,
      status: grade.status || (grade.grade !== null ? 'graded' : 'submitted'),
      teacher_observation: grade.teacher_observation || null,
      has_teacher_observation: !!grade.teacher_observation
    }));
  } catch (error: any) {
    console.error('Erro ao obter notas no Supabase:', error);
    throw new Error(error.message || 'Não foi possível buscar as notas das atividades.');
  }
}

export async function getActivityTeams(activityId: number) {
  try {
    const { data: act } = await supabase
      .from('activities')
      .select('id, name, type')
      .eq('id', activityId)
      .single();

    if (!act) throw new Error('Atividade não encontrada');

    if (act.type !== 'team') {
      return {
        activity_id: activityId,
        activity_name: act.name,
        activity_type: 'individual',
        teams: [],
        total_teams: 0,
        total_students: 0
      };
    }

    const { data: submissions } = await supabase
      .from('activity_grades')
      .select(`
        id,
        activity_id,
        grade,
        submitted_at,
        enrollments!inner(
          profiles!inner(
            full_name,
            email,
            student_registration
          )
        )
      `)
      .eq('activity_id', activityId);

    const teams = (submissions || []).map((sub: any, index: number) => ({
      team_id: sub.id,
      team_name: `Equipe ${index + 1}`,
      leader: {
        id: sub.id,
        name: sub.enrollments?.profiles?.full_name || 'Líder',
        email: sub.enrollments?.profiles?.email || '',
        student_registration: sub.enrollments?.profiles?.student_registration || '',
        is_leader: true,
        grade: sub.grade,
        status: 'graded'
      },
      members: [],
      grade: sub.grade,
      status: 'graded',
      submitted_at: sub.submitted_at
    }));

    return {
      activity_id: activityId,
      activity_name: act.name,
      activity_type: 'team',
      teams: teams,
      total_teams: teams.length,
      total_students: teams.length
    };
  } catch (error) {
    console.error('Erro ao buscar equipes no Supabase:', error);
    return {
      activity_id: activityId,
      activity_name: '',
      activity_type: 'team',
      teams: [],
      total_teams: 0,
      total_students: 0
    };
  }
}

