'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";

export default function SummarizePage() {
  const [topic, setTopic] = useState('');
  const [studyMaterials, setStudyMaterials] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const handleGenerateSummary = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setSummary("");

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        alert("You must be logged in to generate a summary.");
        setIsLoading(false);
        return;
    }
    const user = JSON.parse(storedUser);

    try {
        const response = await fetch('http://localhost:3001/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': user.accessToken,
            },
            body: JSON.stringify({ topic, studyMaterials }),
        });

        const data = await response.json();

        if (response.ok) {
            setSummary(data.summary);
        } else {
            alert(`Failed to generate summary: ${data.message}`);
        }
    } catch (error) {
        console.error("Summarization error:", error);
        alert("An error occurred. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8">
       <h1 className="text-2xl font-bold font-display tracking-tight mb-6">Topic Summarizer</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Input Column */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Enter Your Study Material</CardTitle>
            <CardDescription>Provide a topic and the text you want to summarize.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateSummary} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Recursion in Computer Science" value={topic} onChange={(e) => setTopic(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materials">Study Materials</Label>
                <Textarea
                  id="materials"
                  placeholder="Paste your notes, article, or any text here..."
                  className="min-h-[300px]"
                  value={studyMaterials}
                  onChange={(e) => setStudyMaterials(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Summary
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Column */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-display">Generated Summary</CardTitle>
            <CardDescription>The AI-powered summary will appear below.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>Generating contextual summary...</p>
              </div>
            ) : summary ? (
              <p className="leading-relaxed whitespace-pre-wrap">{summary}</p>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Your summary will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}