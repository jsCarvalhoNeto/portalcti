/**
 * Configuração do Painel do Professor
 * Arquivo de configuração centralizado para personalização
 */

export interface TeacherDashboardConfig {
  // Configurações gerais
  appName: string;
  appVersion: string;
  supportEmail: string;
  
  // Configurações de disciplinas
  maxSubjectsPerTeacher: number;
  maxStudentsPerSubject: number;
  defaultSemester: string;
  
  // Configurações de alunos
  maxStudentsPerPage: number;
  studentSearchFields: string[];
  
  // Configurações de atividades
  maxActivitiesPerSubject: number;
  defaultActivityWeight: number;
  activityTypes: ActivityType[];
  
  // Configurações de calendário
  calendarViewOptions: CalendarView[];
  defaultCalendarView: string;
  eventReminderTimes: number[];
  
  // Configurações de notificações
  notificationTypes: NotificationType[];
  defaultNotificationPreferences: NotificationPreferences;
  
  // Configurações de segurança
  passwordMinLength: number;
  passwordRequirements: PasswordRequirement[];
  
  // Configurações de UI
  theme: ThemeConfig;
  responsiveBreakpoints: ResponsiveBreakpoints;
}

export interface ActivityType {
  id: string;
  name: string;
  weight: number;
  color: string;
}

export interface CalendarView {
  id: string;
  name: string;
  icon: string;
}

export interface NotificationType {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface PasswordRequirement {
  id: string;
  name: string;
  regex: string;
  description: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

// Configuração padrão
export const defaultTeacherDashboardConfig: TeacherDashboardConfig = {
  appName: 'Painel do Professor',
  appVersion: '1.0.0',
  supportEmail: 'suporte@instituicao.edu.br',
  
  maxSubjectsPerTeacher: 10,
  maxStudentsPerSubject: 50,
  defaultSemester: '2025.2',
  
  maxStudentsPerPage: 20,
  studentSearchFields: ['full_name', 'email', 'student_registration'],
  
  maxActivitiesPerSubject: 20,
  defaultActivityWeight: 1.0,
  activityTypes: [
    { id: 'assignment', name: 'Trabalho', weight: 1.0, color: 'blue' },
    { id: 'exam', name: 'Prova', weight: 2.0, color: 'red' },
    { id: 'project', name: 'Projeto', weight: 3.0, color: 'green' },
    { id: 'presentation', name: 'Apresentação', weight: 1.5, color: 'purple' },
    { id: 'quiz', name: 'Quiz', weight: 0.5, color: 'orange' }
  ],
  
  calendarViewOptions: [
    { id: 'month', name: 'Mês', icon: 'Calendar' },
    { id: 'week', name: 'Semana', icon: 'CalendarWeek' },
    { id: 'day', name: 'Dia', icon: 'CalendarDay' }
  ],
  defaultCalendarView: 'week',
  eventReminderTimes: [15, 30, 60, 1440], // minutos antes do evento
  
  notificationTypes: [
    { id: 'activity_due', name: 'Atividade Pendente', description: 'Lembrete de atividades com prazo próximo', defaultEnabled: true },
    { id: 'grade_published', name: 'Nota Publicada', description: 'Notificação quando notas forem publicadas', defaultEnabled: true },
    { id: 'new_student', name: 'Novo Aluno', description: 'Alerta quando novo aluno se matricula', defaultEnabled: true },
    { id: 'system_update', name: 'Atualização do Sistema', description: 'Notificações sobre atualizações e manutenções', defaultEnabled: true }
  ],
  defaultNotificationPreferences: {
    email: true,
    push: true,
    sms: false
  },
  
  passwordMinLength: 8,
  passwordRequirements: [
    { id: 'uppercase', name: 'Letras maiúsculas', regex: '(?=.*[A-Z])', description: 'Pelo menos uma letra maiúscula' },
    { id: 'lowercase', name: 'Letras minúsculas', regex: '(?=.*[a-z])', description: 'Pelo menos uma letra minúscula' },
    { id: 'numbers', name: 'Números', regex: '(?=.*[0-9])', description: 'Pelo menos um número' },
    { id: 'special', name: 'Caracteres especiais', regex: '(?=.*[!@#$%^&*])', description: 'Pelo menos um caractere especial' }
  ],
  
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    backgroundColor: '#f8fafc',
    cardBackgroundColor: '#ffffff',
    textColor: '#1e293b',
    borderColor: '#e2e8f0',
    borderRadius: '0.5rem'
  },
  
  responsiveBreakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    largeDesktop: 1536
  }
};

// Função para carregar configuração personalizada
export const loadCustomConfig = async (): Promise<TeacherDashboardConfig> => {
  try {
    // Em ambiente de produção, isso poderia carregar de um endpoint da API
    // ou de variáveis de ambiente
    const customConfig = localStorage.getItem('teacherDashboardConfig');
    if (customConfig) {
      return { ...defaultTeacherDashboardConfig, ...JSON.parse(customConfig) };
    }
    return defaultTeacherDashboardConfig;
  } catch (error) {
    console.warn('Erro ao carregar configuração personalizada:', error);
    return defaultTeacherDashboardConfig;
  }
};

// Função para salvar configuração personalizada
export const saveCustomConfig = (config: Partial<TeacherDashboardConfig>): void => {
  try {
    const currentConfig = localStorage.getItem('teacherDashboardConfig');
    const mergedConfig = currentConfig 
      ? { ...defaultTeacherDashboardConfig, ...JSON.parse(currentConfig), ...config }
      : { ...defaultTeacherDashboardConfig, ...config };
    
    localStorage.setItem('teacherDashboardConfig', JSON.stringify(mergedConfig));
  } catch (error) {
    console.error('Erro ao salvar configuração personalizada:', error);
  }
};

// Função para resetar para configuração padrão
export const resetToDefaultConfig = (): void => {
  try {
    localStorage.removeItem('teacherDashboardConfig');
  } catch (error) {
    console.error('Erro ao resetar configuração:', error);
  }
};

export default defaultTeacherDashboardConfig;
