'use client'; 

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, BookOpen, BrainCircuit, Lightbulb, Loader2, CalendarDays, Bell, Upload, Send, Zap } from "lucide-react"; // Added Zap
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

// TypeScript types
interface User {
  id: number; email: string; university: string; scheme: number | null;
  program: string; semester: number; accessToken: string;
}
interface Course { course_code: string; course_name: string; }
// interface ChatMessage { role: 'user' | 'model'; content: string; } // No longer needed here
interface ScheduleEvent { event_name: string; event_date: string; }

// Dummy Data
const studyProgressData = [
  { week: 'W1', score: 65 },
  { week: 'W2', score: 70 },
  { week: 'W3', score: 68 },
  { week: 'W4', score: 75 },
  { week: 'W5', score: 80 },
  { week: 'W6', score: 78 },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  // --- REMOVED Chat State (it's now in the Chatbot component) ---
  // const [isChatLoading, setIsChatLoading] = useState(false);
  // const [chatInput, setChatInput] = useState("");
  // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate(); // For navigation

  // --- Utility: Get User from localStorage ---
  const getStoredUser = (): User | null => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  };

  // --- 1. On Page Load: Get User and Fetch Data ---
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      fetchOrFindCourses(storedUser);
      fetchSchedule(storedUser);
    } else {
      // No user found, redirect to login
      navigate('/login');
    }
  }, []); // Run once on component mount

  // --- 2. Fetch or Find Courses ---
  const fetchOrFindCourses = async (currentUser: User) => {
    setIsLoadingCourses(true);
    const { university, program, semester, scheme, accessToken } = currentUser;

    // Check if courses are already in localStorage
    const cachedCourses = localStorage.getItem('courses');
    if (cachedCourses) {
      setCourses(JSON.parse(cachedCourses));
      setIsLoadingCourses(false);
      return; // Found in cache, no need to fetch
    }
    
    // Not in cache, fetch from API
    try {
      const response = await fetch(`http://localhost:3001/api/courses?university=${university}&program=${program}&semester=${semester}&scheme=${scheme}`, {
        headers: { 'x-access-token': accessToken }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data: Course[] = await response.json();
      setCourses(data);
      localStorage.setItem('courses', JSON.stringify(data)); // Save to cache
    } catch (error) {
      console.error('Failed to fetch or find courses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch your courses.",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // --- 3. Fetch Academic Schedule ---
  const fetchSchedule = async (currentUser: User) => {
    setIsLoadingSchedule(true);
    try {
      const response = await fetch('http://localhost:3001/api/schedule', {
        headers: { 'x-access-token': currentUser.accessToken }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data: ScheduleEvent[] = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      // Don't toast for schedule, it's less critical
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // --- 4. Handle PDF File Selection ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPdfFile(event.target.files[0]);
    }
  };

  // --- 5. Handle PDF Upload ---
  const handleScheduleUpload = async () => {
    if (!pdfFile) {
      toast({ variant: "destructive", title: "No file selected." });
      return;
    }
    if (!user) return; // Should not happen

    setIsUploading(true);
    const formData = new FormData();
    formData.append('schedulePdf', pdfFile);

    try {
      const response = await fetch('http://localhost:3001/api/schedule', {
        method: 'POST',
        headers: { 'x-access-token': user.accessToken },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      setSchedule(data); // Set the new schedule
      setPdfFile(null); // Clear the file input
      toast({ title: "Success", description: "Academic schedule updated!" });
    } catch (error: any) {
      console.error('Schedule upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload schedule.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- 6. Handle Chat Submit (REMOVED) ---
  // All chat logic is now in the <Chatbot /> component.

  return (
    // *** UPDATED: Changed grid to 2 cols, so the main col spans all width ***
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-2 xl:grid-cols-2">
      
      {/* Column 1: Schedule & Courses (Now spans full width) */}
      {/* *** UPDATED: This column now spans 2 cols *** */}
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        
        {/* Schedule Card */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">Academic Schedule</CardTitle>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSchedule ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : schedule.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.slice(0, 5).map((event, index) => ( // Show 5 upcoming events
                    <TableRow key={index}>
                      <TableCell className="font-medium">{event.event_name}</TableCell>
                      <TableCell className="text-right">{new Date(event.event_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              // This is the Upload UI
              <div className="text-center text-muted-foreground p-4">
                <p className="mb-4">No schedule found. Upload your academic calendar PDF to get started.</p>
                <div className="flex items-center justify-center gap-2">
                  <Input 
                    id="pdf-upload" 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="flex-1 max-w-xs" 
                  />
                  <Button onClick={handleScheduleUpload} disabled={isUploading || !pdfFile}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses Header */}
        <div className="flex items-center">
          <h2 className="text-2xl font-display font-bold tracking-tight">Your Courses</h2>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingCourses ? (
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            // Map over the actual courses, but only the first 3
            courses.slice(0, 3).map((course) => (
              <Card key={course.course_code} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <CardTitle className="font-display">{course.course_name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">Topics for your course: {course.course_code}</p>
                {/* *** TYPO FIX 1: This was </Code> *** */}
                </CardContent> 
                <div className="p-6 pt-0">
                  <Button variant="link" className="p-0 h-auto text-primary" asChild>
                    {/* Link to the new Express Mode page */}
                    <Link to={`/express-mode/${encodeURIComponent(course.course_name)}`}>
                      Start analyzing <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            // Show a message if no courses were found
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-center">
                Your course recommendations will appear here once your profile is set up.
              {/* *** TYPO FIX 2: This was </s_p> *** */}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- COLUMN 2 (REMOVED) --- */}
      {/* The static Bytewise Assistant card was here. It is now removed. */}
      {/* The floating chatbot is now loaded in layout.tsx */}

    </main>
  );
}