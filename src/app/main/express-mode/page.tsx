'use client';

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Youtube, Link as LinkIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define TypeScript types
interface User { accessToken: string; }
interface CourseMaterial { title: string; url: string; }
interface Materials {
    youtubeLectures: CourseMaterial[];
    notes: CourseMaterial[];
}
interface PyqTopic { topic: string; frequency: number; }

export default function ExpressModePage() {
    const { courseName } = useParams<{ courseName: string }>(); // Get course name from URL
    const { toast } = useToast();
    const [materials, setMaterials] = useState<Materials | null>(null);
    const [pyqAnalysis, setPyqAnalysis] = useState<PyqTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser || !courseName) {
            setIsLoading(false);
            return;
        }
        const user: User = JSON.parse(storedUser);

        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch both material analysis and PYQ analysis in parallel
                const [materialsRes, pyqRes] = await Promise.all([
                    // 1. Fetch Course Materials (YouTube, Notes)
                    fetch(`http://localhost:3001/api/course-materials`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-access-token': user.accessToken 
                        },
                        body: JSON.stringify({ courseName: decodeURIComponent(courseName) }),
                    }),
                    // 2. Fetch PYQ Analysis
                    fetch(`http://localhost:3001/api/pyq-analysis?courseName=${encodeURIComponent(courseName)}`, {
                        headers: { 'x-access-token': user.accessToken }
                    })
                ]);

                if (materialsRes.ok) {
                    setMaterials(await materialsRes.json());
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Could not load course materials." });
                }

                if (pyqRes.ok) {
                    setPyqAnalysis(await pyqRes.json());
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Could not load PYQ analysis." });
                }

            } catch (error: any) {
                console.error("Express Mode fetch error:", error);
                toast({ variant: "destructive", title: "Network Error", description: error.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [courseName, toast]);

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
            <h1 className="text-3xl font-bold font-display tracking-tight text-primary">{decodeURIComponent(courseName || "Express Mode")}</h1>
            <p className="text-lg text-muted-foreground -mt-4">Your comprehensive overview for exam preparation.</p>
            
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Column 1: PYQ Analysis */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="text-primary"/> PYQ Topic Analysis</CardTitle>
                        <CardDescription>Top topics from previous year questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Topic</TableHead><TableHead className="text-right">Frequency</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {pyqAnalysis.length > 0 ? pyqAnalysis.map((item) => (
                                    <TableRow key={item.topic}>
                                        <TableCell className="font-medium">{item.topic}</TableCell>
                                        <TableCell className="text-right">{item.frequency}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center">No PYQ analysis found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Column 2: Materials (YouTube & Notes) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Youtube className="text-red-500" /> YouTube Lectures</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {materials?.youtubeLectures.length > 0 ? materials.youtubeLectures.map((video, index) => (
                                <a key={index} href={video.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-accent">
                                    <p className="font-semibold text-primary truncate">{video.title}</p>
                                </a>
                            )) : <p className="text-sm text-muted-foreground">No YouTube lectures found.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="text-blue-500" /> Quick Notes</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {materials?.notes.length > 0 ? materials.notes.map((note, index) => (
                                <a key={index} href={note.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-accent">
                                    <p className="font-semibold text-primary truncate">{note.title}</p>
                                </a>
                            )) : <p className="text-sm text-muted-foreground">No notes found.</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Quick Summary (Placeholder) */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Summary</CardTitle>
                        <CardDescription>AI-generated summary (placeholder).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted rounded-lg text-muted-foreground italic">
                            <p>This feature is coming soon!</p>
                            <p className="mt-2">An AI-generated summary of your notes and PYQ topics will appear here to help you revise quickly.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
