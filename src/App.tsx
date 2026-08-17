import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAchievements from './pages/TeacherAchievements';
import TeacherDailyChallenges from './pages/TeacherDailyChallenges';
import Achievements from './pages/Achievements';
import AdminDashboard from "./pages/AdminDashboard";
import TeacherSubjectEditor from "./pages/TeacherSubjectEditor";
import InteractiveActivities from "./pages/InteractiveActivities";
import ActivityFiles from "./pages/ActivityFiles";
import GoogleDriveTest from "./pages/GoogleDriveTest";
import MemoryGame from "./pages/logic-programming/MemoryGame";
import HtmlCssFormActivity from "./pages/html-css/HtmlCssFormActivity";
import Gamification from "./pages/Gamification";
import NotFound from "./pages/NotFound";
import PollVotingPage from './pages/PollVotingPage';
import QuickVotePublicPage from './pages/QuickVotePublicPage';
import EventsPage from './components/pages/EventsPage';
import EventRegistration from './pages/EventRegistration';
import EventThematicAxes from './pages/EventThematicAxes';
import EventTeamForm from './pages/EventTeamForm';
import EventConfirmation from './pages/EventConfirmation';
import StudentCareer from './pages/StudentCareer';
import PublicCareerProfile from './pages/PublicCareerProfile';
import ThermometerVotePage from './pages/ThermometerVotePage';
import WordCloudVotePage from './pages/WordCloudVotePage';
import HelpQueueStudentPage from './pages/HelpQueueStudentPage';
import TeamRegistrationPage from './pages/TeamRegistrationPage';
import StudentPickerJoinPage from './pages/StudentPickerJoinPage';

// Adicionar esta interface se não existir
interface PollData {
  id: string;
  title: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    voters: string[];
  }>;
  isActive: boolean;
  createdAt: string;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary fallbackRoute="/eventos">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/disciplinas" element={<Subjects />} />
              <Route path="/disciplinas/:id" element={<SubjectDetail />} />
              <Route path="/disciplinas/:id/interactive-activities" element={<InteractiveActivities />} />
              <Route path="/disciplinas/:id/activity-files/:activityId" element={<ActivityFiles />} />
              <Route path="/google-drive-test" element={<GoogleDriveTest />} />
              <Route path="/disciplinas/:id/interactive-activities/memory-game" element={<MemoryGame />} />
              <Route path="/disciplinas/:id/interactive-activities/memory-game/:level" element={<MemoryGame />} />
              <Route path="/disciplinas/:id/interactive-activities/html-css-form" element={<HtmlCssFormActivity />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/eventos" element={<EventsPage />} />
              <Route path="/eventos/inscricao" element={<EventRegistration />} />
              <Route path="/eventos/eixos-tematicos" element={<EventThematicAxes />} />
              <Route path="/eventos/equipe" element={<EventTeamForm />} />
              <Route path="/eventos/confirmacao" element={
                <ErrorBoundary fallbackRoute="/eventos/inscricao">
                  <EventConfirmation />
                </ErrorBoundary>
              } />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/career" element={<StudentCareer />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/achievements" element={<TeacherAchievements />} />
              <Route path="/teacher/daily-challenges" element={<TeacherDailyChallenges />} />
              <Route path="/teacher/subjects/:id/edit" element={<TeacherSubjectEditor />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/poll/:pollId" element={<PollVotingPage />} />
              <Route path="/enquete" element={<PollVotingPage />} />
              <Route path="/enquete/:code" element={<PollVotingPage />} />
              <Route path="/votar" element={<QuickVotePublicPage />} />
              <Route path="/votar/:hash" element={<QuickVotePublicPage />} />
              <Route path="/votacao" element={<QuickVotePublicPage />} />
              <Route path="/votacao/:hash" element={<QuickVotePublicPage />} />
              <Route path="/termometro" element={<ThermometerVotePage />} />
              <Route path="/termometro/:code" element={<ThermometerVotePage />} />
              <Route path="/nuvem" element={<WordCloudVotePage />} />
              <Route path="/nuvem/:code" element={<WordCloudVotePage />} />
              <Route path="/fila" element={<HelpQueueStudentPage />} />
              <Route path="/fila/:code" element={<HelpQueueStudentPage />} />
              <Route path="/equipes" element={<TeamRegistrationPage />} />
              <Route path="/equipes/:code" element={<TeamRegistrationPage />} />
              <Route path="/sorteio" element={<StudentPickerJoinPage />} />
              <Route path="/sorteio/:code" element={<StudentPickerJoinPage />} />

              {/* Rota pública para perfil de carreira */}
              <Route path="/talento/:studentId" element={<PublicCareerProfile />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
