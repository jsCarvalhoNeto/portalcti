import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import SubjectDetails from '@/pages/SubjectDetails';
import InteractiveActivities from '@/pages/InteractiveActivities';
import ActivityFiles from '@/pages/ActivityFiles';
import MemoryGame from '@/pages/MemoryGame';
import HTMLCSSExercise from '@/pages/HTMLCSSExercise';
import StudentDashboard from '@/pages/StudentDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import StudentProfiles from '@/pages/StudentProfiles';
import SubjectManagement from '@/pages/SubjectManagement';
import ActivityManagement from '@/pages/ActivityManagement';
import UserManagement from '@/pages/UserManagement';
import EnrollmentManagement from '@/pages/EnrollmentManagement';
import { useState } from 'react';

export default function App() {
  const [isActivityFilesOpen, setIsActivityFilesOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Rotas de disciplinas */}
            <Route path="/subject/:id" element={
              <ProtectedRoute>
                <SubjectDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/disciplinas/:id/interactive-activities" element={
              <ProtectedRoute allowedRoles={['student']}>
                <InteractiveActivities />
              </ProtectedRoute>
            } />

            {/* Nova rota para demonstração de arquivos */}
            <Route path="/disciplinas/:id/activity-files/:activityId" element={
              <ProtectedRoute>
                <ActivityFiles />
              </ProtectedRoute>
            } />
            
            <Route path="/disciplinas/:id/interactive-activities/memory-game/:level" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MemoryGame />
              </ProtectedRoute>
            } />
            
            <Route path="/disciplinas/:id/interactive-activities/html-css-form" element={
              <ProtectedRoute allowedRoles={['student']}>
                <HTMLCSSExercise />
              </ProtectedRoute>
            } />
            
            {/* Rotas de gerenciamento */}
            <Route path="/profiles" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <StudentProfiles />
              </ProtectedRoute>
            } />
            
            <Route path="/subjects" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <SubjectManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/activities" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <ActivityManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/enrollments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EnrollmentManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}