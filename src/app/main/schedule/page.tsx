'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// TypeScript types
interface User {
  id: number; email: string; university: string; scheme: number | null;
  program: string; semester: number; accessToken: string;
}
interface ScheduleEvent { event_name: string; event_date: string; }

export default function SchedulePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Single loading state for the page
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchSchedule(parsedUser.accessToken); // Fetch schedule on load
    } else {
      setIsLoading(false);
      // Handle user not being logged in
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to view this page.",
      });
    }
  }, []);

  const fetchSchedule = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/schedule`, {
        headers: { 'x-access-token': accessToken }
      });
      const data = await response.json();
      if (response.ok) {
        setSchedule(data);
      } else {
        throw new Error(data.message || "Failed to fetch schedule");
      }
    } catch (error: any) {
      console.error("Failed to fetch schedule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleUpload = async () => {
    if (!scheduleFile || !user) {
        toast({ variant: "destructive", title: "Error", description: "Please select a PDF file to upload."});
        return;
    }
    
    setIsLoading(true); // Use the main loader
    const formData = new FormData();
    formData.append('schedulePdf', scheduleFile);

    try {
        const response = await fetch('http://localhost:3001/api/schedule', {
            method: 'POST',
            headers: {
                'x-access-token': user.accessToken,
            },
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            setSchedule(data); 
            toast({ title: "Success", description: "Your academic schedule has been uploaded and parsed." });
            setScheduleFile(null); // Clear the file input
            // Clear the file input field visually
            (document.getElementById('schedule-pdf') as HTMLInputElement).value = "";
        } else {
            throw new Error(data.message || "Failed to upload schedule.");
        }
    } catch (error: any) {
        console.error("Schedule upload error:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold font-display tracking-tight">Academic Schedule Management</h1>
      
      {/* Upload Card - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Calendar</CardTitle>
          <CardDescription>Upload a new or updated academic calendar PDF. This will overwrite any existing schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 max-w-md">
            <div className="flex-grow space-y-1 text-left">
              <Label htmlFor="schedule-pdf" className="text-xs">Syllabus PDF</Label>
              <Input 
                id="schedule-pdf" 
                type="file" 
                accept=".pdf" 
                className="h-9"
                onChange={(e) => e.target.files && setScheduleFile(e.target.files[0])}
              />
            </div>
            <Button onClick={handleScheduleUpload} disabled={!scheduleFile || isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Display Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>All upcoming events found in your academic calendar, sorted by date.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16 space-x-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Loading Schedule...</span>
            </div>
          ) : schedule.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {new Date(event.event_date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                      </TableCell>
                      <TableCell>{event.event_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground p-16">
              <p>No schedule events found in your database.</p>
              <p className="text-sm">Please upload your academic calendar PDF above to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

