import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// Import Layouts
import AuthLayout from './app/auth/layout';
import MainLayout from './app/main/layout';

// Import Pages
import LandingPage from './app/page';
import LoginPage from './app/auth/login/page';
import SignupPage from './app/auth/signup/page';
import DashboardPage from './app/main/dashboard/page';
import SummarizePage from './app/main/summarize/page';
import AnalyzePage from './app/main/analyze/page';
import AutomatedAnalyzePage from './app/main/analyze/topic/page';
import PracticePage from './app/main/practice/page';
import CourseAnalysisPage from './app/main/course-analysis/page';
import SchedulePage from './app/main/schedule/page';
import ExpressModePage from './app/main/express-mode/page';

// Import UI Components
import { Toaster } from "@/components/ui/toaster"; // For notifications

function App() {
  return (
    <BrowserRouter>
      {/* The Router defines all pages */}
      <Routes>
        {/* Landing Page (e.g., "/") */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Group (e.g., "/login", "/signup") */}
        <Route element={<AuthLayout><Outlet /></AuthLayout>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Main App Group (all pages inside the sidebar) */}
        <Route element={<MainLayout><Outlet /></MainLayout>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/summarize" element={<SummarizePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/analyze/:topic" element={<AutomatedAnalyzePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/course-analysis" element={<CourseAnalysisPage />} />
          <Route path="/express-mode/:courseName" element={<ExpressModePage />} />
        </Route>
      </Routes>
      
      {/* The Toaster component must be inside the BrowserRouter to work */}
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

