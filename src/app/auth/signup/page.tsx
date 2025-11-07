'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // <-- Corrected import path

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [semester, setSemester] = useState('');
  const [scheme, setScheme] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newUser = { 
      email, 
      password, 
      university, 
      program, 
      semester: Number(semester), 
      scheme: university.toUpperCase() === 'KTU' ? Number(scheme) : null 
    };

    try {
      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Signup Successful!",
          description: "Please log in with your new account.",
        });
        navigate('/login');
      } else {
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: data.message || "Could not create account.",
        });
      }
    } catch (error) {
      console.error('An error occurred during signup:', error);
       toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Create Your Account</CardTitle>
        <CardDescription>
          Join Bytewise to supercharge your studies.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="student@university.edu" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input id="university" placeholder="e.g., KTU" required value={university} onChange={(e) => setUniversity(e.target.value)} />
          </div>

          {university.toUpperCase() === 'KTU' && (
            <div className="space-y-2">
              <Label htmlFor="scheme">Scheme (e.g., 2019)</Label>
              <Input id="scheme" type="number" placeholder="2019" required value={scheme} onChange={(e) => setScheme(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input id="program" placeholder="e.g., B.Tech CSE" required value={program} onChange={(e) => setProgram(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                   <Select onValueChange={setSemester} value={semester}>
                      <SelectTrigger id="semester">
                          <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit">Sign Up</Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline">
              Log In
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

