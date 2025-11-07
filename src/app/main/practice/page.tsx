'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Lightbulb, ArrowLeft, ArrowRight, CheckCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // <-- ** 1. Import useToast **

// Define TypeScript types for our quiz data
type QuizState = 'form' | 'loading' | 'active' | 'results';
interface Question {
    question: string;
    options: string[];
    answer: string;
    hint: string;
}

export default function PracticePage() {
    const [quizState, setQuizState] = useState<QuizState>('form');
    const [topic, setTopic] = useState('');
    const [studyMaterials, setStudyMaterials] = useState('');
    
    const [quiz, setQuiz] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [score, setScore] = useState(0);

    const { toast } = useToast(); // <-- ** 2. Initialize toast **

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setQuizState('loading');

        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast({ variant: "destructive", title: "You must be logged in to generate a quiz." });
            setQuizState('form');
            return;
        }
        const user = JSON.parse(storedUser);

        try {
            const response = await fetch('http://localhost:3001/api/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': user.accessToken,
                },
                body: JSON.stringify({ topic, studyMaterials }),
            });

            const data = await response.json();
            if (response.ok) {
                // Ensure data.quiz is an array and not empty
                if (!data.quiz || data.quiz.length === 0) {
                    throw new Error("AI returned an empty or invalid quiz.");
                }
                setQuiz(data.quiz); 
                setUserAnswers(new Array(data.quiz.length).fill(''));
                setCurrentQuestion(0); // Reset to first question
                setQuizState('active');
            } else {
                throw new Error(data.error || data.message || "Failed to generate quiz");
            }
        } catch (error: any) {
            console.error("Quiz generation error:", error);
            toast({ variant: "destructive", title: "Error", description: error.message });
            setQuizState('form');
        }
    };

    const handleAnswerSelect = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = value;
        setUserAnswers(newAnswers);
    };

    // *** 3. NEW FUNCTION: Save results to DB ***
    // This is a "fire and forget" call. We don't need to wait for it.
    const saveResultToDb = (calculatedScore: number, correctCount: number) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return; // User is logged out, can't save.

        const user = JSON.parse(storedUser);

        fetch('http://localhost:3001/api/quiz/save-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': user.accessToken,
            },
            body: JSON.stringify({
                topic: topic,
                score: calculatedScore,
                totalQuestions: quiz.length,
                correctAnswers: correctCount
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                console.log("Quiz result saved successfully.");
                toast({ title: "Quiz result saved!" });
            } else {
                console.warn("Failed to save quiz result:", data.error);
                toast({ variant: "destructive", title: "Could not save result", description: data.error });
            }
        })
        .catch(err => {
            console.error("Error saving quiz result:", err);
            // Don't bother the user with this, just log it
        });
    };

    const handleSubmit = () => {
        let correctAnswers = 0;
        quiz.forEach((q, index) => {
            if (q.answer === userAnswers[index]) {
                correctAnswers++;
            }
        });
        const calculatedScore = (correctAnswers / quiz.length) * 100;
        setScore(calculatedScore);
        setQuizState('results');

        // *** 4. CALL the new save function ***
        saveResultToDb(calculatedScore, correctAnswers);
    };

    const resetQuiz = () => {
        setQuizState('form');
        setCurrentQuestion(0);
        setUserAnswers([]);
        setScore(0);
        setTopic('');
        setStudyMaterials('');
    };

    if (quizState === 'form' || quizState === 'loading') {
        return (
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="font-display">Practice Quiz Generator</CardTitle>
                        <CardDescription>Input a topic and optional notes to generate a custom quiz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerateQuiz} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic</Label>
                                <Input id="topic" placeholder="e.g., Design and Analysis of Algorithms" value={topic} onChange={(e) => setTopic(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="materials">Study Materials (Optional)</Label>
                                <Textarea id="materials" placeholder="Paste your notes here for a more tailored quiz..." className="min-h-[200px]" value={studyMaterials} onChange={(e) => setStudyMaterials(e.target.value)} />
                            </div>
                            <Button type="submit" disabled={quizState === 'loading'} className="w-full">
                                {quizState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                Generate Quiz
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    if (quizState === 'results') {
        return (
             <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-display text-2xl">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center">
                            <CheckCircle className="h-16 w-16 text-primary mb-4" />
                            <p className="text-muted-foreground">You scored</p>
                            <p className="text-5xl font-bold font-display text-primary">{Math.round(score)}%</p>
                        </div>
                        <Button onClick={resetQuiz} className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Take a New Quiz
                        </Button>
                    </CardContent>
                </Card>
             </main>
        );
    }

    // Safety check for empty quiz array
    if (!quiz || quiz.length === 0) {
        return (
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="font-display text-2xl">Error</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>The AI returned an empty or invalid quiz. Please try again.</p>
                        <Button onClick={resetQuiz} className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const activeQuestion = quiz[currentQuestion];
    return (
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="font-display">Question {currentQuestion + 1} of {quiz.length}</CardTitle>
                    <CardDescription className="pt-2 text-lg">{activeQuestion.question}</CardDescription>
                    {activeQuestion.hint && (
                        <p className="text-sm text-muted-foreground pt-2">Hint: {activeQuestion.hint}</p>
                    )}
                </CardHeader>
                <CardContent>
                    <RadioGroup value={userAnswers[currentQuestion]} onValueChange={handleAnswerSelect} className="space-y-3">
                        {activeQuestion.options.map((opt) => (
                            <Label key={opt} className="flex items-center gap-4 border rounded-md p-4 hover:bg-accent cursor-pointer has-[[data-state=checked]]:border-primary">
                                <RadioGroupItem value={opt} />
                                {opt}
                            </Label>
                        ))}
                    </RadioGroup>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setCurrentQuestion(q => q - 1)} disabled={currentQuestion === 0}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        {currentQuestion < quiz.length - 1 ? (
                            <Button onClick={() => setCurrentQuestion(q => q + 1)}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={!userAnswers[currentQuestion]}>Submit</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}