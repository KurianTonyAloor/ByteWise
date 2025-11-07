import { Button } from "@/components/ui/button";
import { BotMessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
        <div className="mb-4 flex items-center gap-3">
            <BotMessageSquare className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold font-display tracking-tight">
              Bytewise
            </h1>
        </div>
        <p className="max-w-xl text-lg text-muted-foreground mb-8">
            Your personal AI-powered learning assistant. Summarize topics, analyze papers, and generate practice quizzes to ace your exams.
        </p>
        <div className="flex gap-4">
            <Button asChild size="lg">
                <Link href="/login">
                    Log In <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
    </div>
  );
}