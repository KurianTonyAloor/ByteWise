'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Youtube, Link as LinkIcon } from "lucide-react";

// Define TypeScript types
interface Course { course_code: string; course_name: string; }
interface Materials {
    youtubeLectures: { title: string; url: string; }[];
    notes: { title: string; url: string; }[];
}

export default function CourseAnalysisPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [materials, setMaterials] = useState<Materials | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch the user's courses on component mount to populate the dropdown
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const query = new URLSearchParams({
                university: user.university, scheme: String(user.scheme),
                program: user.program, semester: String(user.semester),
            }).toString();

            fetch(`http://localhost:3001/api/courses?${query}`, {
                headers: { 'x-access-token': user.accessToken }
            }).then(res => res.json()).then(data => {
                if (data.length > 0) setCourses(data);
            });
        }
    }, []);

    const handleFindMaterials = async () => {
        if (!selectedCourse) {
            alert("Please select a course first.");
            return;
        }
        setIsLoading(true);
        setMaterials(null);

        const storedUser = localStorage.getItem('user');
        const user = JSON.parse(storedUser!);
        
        try {
            // --- THIS IS THE FIX ---
            // Changed to a POST request with the courseName in the body to match the backend
            const response = await fetch(`http://localhost:3001/api/course-materials`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-access-token': user.accessToken 
                },
                body: JSON.stringify({ courseName: selectedCourse }),
            });
            // --------------------

            if (!response.ok) {
                // Try to get a meaningful error message from the server
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            setMaterials(data);

        } catch (error: any) {
            console.error("Material finding error:", error);
            alert(`Failed to find materials: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8">
            <h1 className="text-2xl font-bold font-display tracking-tight mb-6">Course Analysis</h1>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Find Learning Materials</CardTitle>
                    <CardDescription>Select one of your courses to find relevant YouTube lectures and notes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="course-select">Your Courses</Label>
                            <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                                <SelectTrigger id="course-select">
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.course_code + course.course_name} value={course.course_name}>
                                            {course.course_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleFindMaterials} disabled={isLoading || !selectedCourse}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Find"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex items-center justify-center p-16 space-x-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>Searching for the best materials...</span>
                </div>
            )}

            {materials && (
                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Youtube className="text-red-500" /> YouTube Lectures</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {materials.youtubeLectures && materials.youtubeLectures.length > 0 ? materials.youtubeLectures.map((video, index) => (
                                <a key={index} href={video.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-accent">
                                    <p className="font-semibold text-primary">{video.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{video.url}</p>
                                </a>
                            )) : <p className="text-muted-foreground">No YouTube lectures found.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="text-blue-500" /> Quick Notes</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {materials.notes && materials.notes.length > 0 ? materials.notes.map((note, index) => (
                                <a key={index} href={note.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-accent">
                                    <p className="font-semibold text-primary">{note.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{note.url}</p>
                                </a>
                            )) : <p className="text-muted-foreground">No notes found.</p>}
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}

