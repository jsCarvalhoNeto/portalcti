import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const Subjects = lazy(() => import("./pages/Subjects"));
const SubjectDetail = lazy(() => import("./pages/SubjectDetail"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherAchievements = lazy(() => import("./pages/TeacherAchievements"));
const TeacherDailyChallenges = lazy(() => import("./pages/TeacherDailyChallenges"));
const Achievements = lazy(() => import("./pages/Achievements"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherSubjectEditor = lazy(() => import("./pages/TeacherSubjectEditor"));
const InteractiveActivities = lazy(() => import("./pages/InteractiveActivities"));
const ActivityFiles = lazy(() => import("./pages/ActivityFiles"));
const GoogleDriveTest = lazy(() => import("./pages/GoogleDriveTest"));
const MemoryGame = lazy(() => import("./pages/logic-programming/MemoryGame"));
const HtmlCssFormActivity = lazy(() => import("./pages/html-css/HtmlCssFormActivity"));
const Gamification = lazy(() => import("./pages/Gamification"));
const PollVotingPage = lazy(() => import("./pages/PollVotingPage"));
const QuickVotePublicPage = lazy(() => import("./pages/QuickVotePublicPage"));
const EventsPage = lazy(() => import("./components/pages/EventsPage"));
const EventRegistration = lazy(() => import("./pages/EventRegistration"));
const EventThematicAxes = lazy(() => import("./pages/EventThematicAxes"));
const EventTeamForm = lazy(() => import("./pages/EventTeamForm"));
const EventConfirmation = lazy(() => import("./pages/EventConfirmation"));
const StudentCareer = lazy(() => import("./pages/StudentCareer"));
const PublicCareerProfile = lazy(() => import("./pages/PublicCareerProfile"));
const ThermometerVotePage = lazy(() => import("./pages/ThermometerVotePage"));
const WordCloudVotePage = lazy(() => import("./pages/WordCloudVotePage"));
const HelpQueueStudentPage = lazy(() => import("./pages/HelpQueueStudentPage"));
const TeamRegistrationPage = lazy(() => import("./pages/TeamRegistrationPage"));
const StudentPickerJoinPage = lazy(() => import("./pages/StudentPickerJoinPage"));
const PublicEducationalGamePage = lazy(() => import("./pages/PublicEducationalGamePage"));
const ShirtOrderStudentPage = lazy(() => import("./pages/ShirtOrderStudentPage"));
const AttendanceCheckInPage = lazy(() => import("./pages/AttendanceCheckInPage"));

const PageLoader = () => (
  <div className="min-h-screen bg-background p-6 sm:p-10">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary fallbackRoute="/eventos">
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/jogos/:shareCode" element={<PublicEducationalGamePage />} />

              {/* Rotas para Chamada Inteligente / Frequência por Código ou QR Code */}
              <Route path="/chamada" element={<AttendanceCheckInPage />} />
              <Route path="/chamada/:code" element={<AttendanceCheckInPage />} />

              {/* Rotas para o Censo/Pedido de Camisas do Curso */}
              <Route path="/camisas" element={<ShirtOrderStudentPage />} />
              <Route path="/camisas/:code" element={<ShirtOrderStudentPage />} />
              <Route path="/camisa" element={<ShirtOrderStudentPage />} />
              <Route path="/camisa/:code" element={<ShirtOrderStudentPage />} />

              {/* Rota pública para perfil de carreira */}
              <Route path="/talento/:studentId" element={<PublicCareerProfile />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
