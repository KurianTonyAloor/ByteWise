'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

// TypeScript types
type AnalysisResult = { topic: string; count: number; };
interface User {
  id: number; email: string; university: string; scheme: number | null;
  program: string; semester: number; accessToken: string;
}
interface Course { course_code: string; course_name: string; }

export default function AnalyzePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // --- NEW STATE for courses and selected course ---
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    // Fetch the user's courses on component mount to populate the dropdown
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);

      const query = new URLSearchParams({
          university: parsedUser.university,
          program: parsedUser.program, 
          semester: String(parsedUser.semester),
      });
      if (parsedUser.scheme) {
        query.append('scheme', String(parsedUser.scheme));
      }

      // Fetch the courses this user has
      fetch(`http://localhost:3001/api/courses?${query.toString()}`, {
          headers: { 'x-access-token': parsedUser.accessToken }
      })
      .then(res => res.json())
      .then(data => {
          if (data.length > 0) setCourses(data);
      })
      .catch(err => {
        console.error("Failed to fetch courses:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your courses for the dropdown."
        });
      })
      .finally(() => setIsLoadingCourses(false));
    } else {
      setIsLoadingCourses(false);
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to use this feature.",
      });
    }
  }, [toast]); // Added toast to dependency array

  const handleAnalyzePaper = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in again."});
      return;
    }
    if (!selectedFile) {
      toast({ variant: "destructive", title: "No File Selected", description: "Please select a PDF file."});
      return;
    }
    if (!selectedCourse) {
      toast({ variant: "destructive", title: "No Course Selected", description: "Please select the course this PDF is for."});
      return;
    }
    
    setIsLoading(true);
    setResults(null);
    
    // We use FormData to send the file and the course name
    const formData = new FormData();
    formData.append('paper', selectedFile);
    formData.append('courseName', selectedCourse); 

    try {
      // Pointing to the dedicated, authenticated endpoint
      const response = await fetch('http://localhost:3001/api/paper-analysis', {
        method: 'POST',
        headers: {
          // Send the authentication token
          'x-access-token': user.accessToken, 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Server responded with ${response.status}` }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      setResults(data);
      toast({
        title: "Analysis Complete!",
        description: `Found ${data.length} topics. Results are now saved for Express Mode.`,
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "An error occurred during the upload.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
     <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <h1 className="text-2xl font-bold font-display tracking-tight mb-6">Question Paper Analyzer</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="font-display">Upload PYQ</CardTitle>
                <CardDescription>Upload a past question paper. We'll analyze it and save the topics to your "Express Mode" page.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAnalyzePaper} className="space-y-6">
                    
                    {/* Course Selection Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="course-select">Which course is this for?</Label>
                      <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                          <SelectTrigger id="course-select">
                              <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course..."} />
                          </SelectTrigger>
                          <SelectContent>
                              {courses.map((course, index) => (
                                  <SelectItem key={course.course_code + index} value={course.course_name}>
                                      {course.course_name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>

                    {/* File Upload Input */}
                    <div className="space-y-2">
                        <Label htmlFor="paper-pdf">Question Paper (PDF)</Label>
                        <Input 
                          id="paper-pdf" 
                          type="file" 
                          accept=".pdf" 
                          onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !selectedFile || !selectedCourse} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Analyze and Save
                    </Button>
                </form>
            </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="flex flex-col min-h-[450px]">
            <CardHeader>
                <CardTitle className="font-display">Analysis Results</CardTitle>
                <CardDescription>A breakdown of the most frequent topics from the PDF.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p>Analyzing PDF...</p>
                    </div>
                 ) : results ? (
                    <div className="w-full h-full flex flex-col gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={results} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="topic" stroke="hsl(var(--primary))" fontSize={12} />
                                <YAxis dataKey="count" stroke="hsl(var(--primary))" fontSize={12} />
                                <Tooltip cursor={{fill: 'hsl(var(--card))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead className="text-right">Frequency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((item) => (
                                    <TableRow key={item.topic}>
                                        <TableCell className="font-medium capitalize">{item.topic}</TableCell>
                                        <TableCell className="text-right">{item.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 ) : (
                    <div className="text-center text-muted-foreground">
                        <p>Analysis results will appear here after upload.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}

