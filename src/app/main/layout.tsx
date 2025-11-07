import { Link } from "react-router-dom";
// Import all the icons we need for navigation
import { Book, BotMessageSquare, FileText, LayoutDashboard, CalendarDays, BarChartHorizontal } from "lucide-react"; 
import { Chatbot } from "@/components/ui/Chatbot"; // <-- 1. IMPORT the new component

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We wrap everything in a Fragment to add the chatbot as a sibling
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-background md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to="/dashboard" className="flex items-center gap-2 font-display font-semibold">
                <BotMessageSquare className="h-6 w-6 text-primary" />
                <span className="">Bytewise</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/schedule" // Assuming this is the correct path for the schedule page
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <CalendarDays className="h-4 w-4" />
                  Academic Schedule
                </Link>

                <Link
                  to="/summarize"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Book className="h-4 w-4" />
                  Summarizer
                </Link>
                <Link
                  to="/analyze"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <FileText className="h-4 w-4" />
                  Paper Analyzer
                </Link>
                <Link
                  to="/practice"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Book className="h-4 w-4" />
                  Practice Quiz
                </Link>
                <Link
                  to="/course-analysis"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <BarChartHorizontal className="h-4 w-4" />
                  Course Analysis
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {/* This <main> tag was missing in the original, I've added it based on your other file */}
          <main className="flex flex-1 flex-col p-4 sm:p-6">{children}</main>
        </div>
      </div>

      {/* --- 2. ADD the chatbot component here --- */}
      {/* It will be outside the main grid and position itself */}
      <Chatbot />
    </>
  );
}