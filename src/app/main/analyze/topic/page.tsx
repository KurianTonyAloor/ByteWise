'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

type AnalysisStatus = 'loading' | 'success' | 'error';
type AnalysisResult = {
    topic: string;
    count: number;
}[];

const mockAnalysisData: AnalysisResult = [
    { topic: "Big O Notation", count: 10 },
    { topic: "Sorting Algs", count: 8 },
    { topic: "Data Structures", count: 7 },
    { topic: "Recursion", count: 6 },
    { topic: "Graphs", count: 4 },
];


export default function AutomatedAnalyzePage() {
  const [status, setStatus] = useState<AnalysisStatus>('loading');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const params = useParams();
  const topic = typeof params.topic === 'string' ? params.topic.replace(/-/g, ' ') : "topic";

  useEffect(() => {
    // Simulate fetching and analyzing based on the topic
    setTimeout(() => {
        // Randomly succeed or fail for demonstration
        if (Math.random() > 0.2) {
            setResults(mockAnalysisData);
            setStatus('success');
        } else {
            setStatus('error');
        }
    }, 3000);
  }, [topic]);

  if (status === 'loading') {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-display capitalize">Finding and analyzing paper for '{topic}'...</h1>
            <p className="text-muted-foreground">This may take a moment.</p>
        </div>
    );
  }

  if (status === 'error') {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-display capitalize">Analysis Failed</h1>
            <p className="text-muted-foreground max-w-md">We couldn't automatically find and analyze a paper for '{topic}'. Please try uploading the paper manually.</p>
            <Button asChild>
                <Link href="/analyze"><ArrowLeft className="mr-2 h-4 w-4"/> Manual Upload</Link>
            </Button>
        </div>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
       <h1 className="text-2xl font-bold font-display tracking-tight mb-2 capitalize">Analysis for: {topic}</h1>
       <p className="text-muted-foreground mb-6">Here is a breakdown of the most frequent topics found.</p>
        <Card>
            <CardContent className="pt-6">
                {results && (
                    <div className="w-full h-full flex flex-col gap-4">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={results} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="topic" stroke="#a3e635" fontSize={12} />
                                <YAxis stroke="#a3e635" fontSize={12} />
                                <Tooltip cursor={{fill: 'hsl(var(--card))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Topic</TableHead><TableHead className="text-right">Frequency</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((item) => (
                                    <TableRow key={item.topic}><TableCell className="font-medium">{item.topic}</TableCell><TableCell className="text-right">{item.count}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    </main>
  );
}