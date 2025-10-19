import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TeacherDashboardProvider } from '@/contexts/TeacherDashboardContext';
import TeacherDashboard from '@/pages/TeacherDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherData } from '@/hooks/useTeacherData';

// Mock dos hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/useTeacherData', () => ({
  useTeacherData: vi.fn()
}));

// Mock do contexto
vi.mock('@/contexts/TeacherDashboardContext', async () => {
  const actual = await vi.importActual('@/contexts/TeacherDashboardContext');
  return {
    ...actual,
    useTeacherDashboard: () => ({
      subjects: [],
      students: [],
      activities: [],
      calendarEvents: [],
      profile: { full_name: 'Professor Teste', email: 'professor@teste.com' },
      loading: { subjects: false, students: false, activities: false, calendar: false, teachers: false },
      error: { subjects: null, students: null, activities: null, calendar: null },
      refetch: { subjects: vi.fn(), students: vi.fn(), activities: vi.fn(), calendar: vi.fn() },
      editingProfile: false,
      setEditingProfile: vi.fn(),
      setActiveTab: vi.fn(),
      activeTab: 'overview'
    })
  };
});

describe('TeacherDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o dashboard do professor quando autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'professor@teste.com' },
      profile: { full_name: 'Professor Teste', email: 'professor@teste.com' },
      isTeacher: true,
      signOut: vi.fn(),
      loading: false
    });

    (useTeacherData as jest.Mock).mockReturnValue({
      subjects: [],
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <TeacherDashboardProvider>
          <TeacherDashboard />
        </TeacherDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Painel do Professor')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo, Professor Teste')).toBeInTheDocument();
  });

  it('deve redirecionar para autenticação quando não autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      isTeacher: false,
      signOut: vi.fn(),
      loading: false
    });

    render(
      <MemoryRouter>
        <TeacherDashboardProvider>
          <TeacherDashboard />
        </TeacherDashboardProvider>
      </MemoryRouter>
    );

    // Deve redirecionar, então não deve mostrar o dashboard
    expect(screen.queryByText('Painel do Professor')).not.toBeInTheDocument();
  });

  it('deve mostrar loading quando estiver carregando', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      isTeacher: true,
      signOut: vi.fn(),
      loading: true
    });

    render(
      <MemoryRouter>
        <TeacherDashboardProvider>
          <TeacherDashboard />
        </TeacherDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
