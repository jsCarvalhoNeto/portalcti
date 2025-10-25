import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherSubjectEditor from "./pages/TeacherSubjectEditor";
import InteractiveActivities from "./pages/InteractiveActivities";
import MemoryGame from "./pages/logic-programming/MemoryGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/disciplinas/:id/interactive-activities/memory-game" element={<MemoryGame />} />
            <Route path="/disciplinas/:id/interactive-activities/memory-game/:level" element={<MemoryGame />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/subjects/:id/edit" element={<TeacherSubjectEditor />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
