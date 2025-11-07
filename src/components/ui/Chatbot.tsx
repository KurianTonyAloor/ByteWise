'use client';

import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, X, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the structure for a chat message
interface Message {
  role: 'user' | 'model';
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  // Initialize with the first welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello! I am Bytewise, your AI academic assistant. How can I help you today?'
    }
  ]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll to the bottom of the chat window when new messages appear
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading || !input.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: input };
    // Add the user's message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // --- API Call Logic ---
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setMessages(prev => [...prev, { role: 'model', content: "You must be logged in to chat." }]);
      setIsLoading(false);
      return;
    }
    const user = JSON.parse(storedUser);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': user.accessToken,
        },
        // Send the new message + the entire history
        body: JSON.stringify({ 
          message: userMessage.content,
          history: messages 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const modelMessage: Message = { role: 'model', content: data.reply };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        throw new Error(data.message || 'Failed to get reply');
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = { 
        role: 'model', 
        content: 'Sorry, I ran into an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* --- CHAT WINDOW (GLASSMORPHIC) --- */}
      <div 
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-md h-[600px]
                    flex flex-col
                    border rounded-xl shadow-xl
                    bg-white/70 backdrop-blur-md dark:bg-black/70
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                  `}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h3 className="font-bold">Bytewise Assistant</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Message List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white dark:bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-muted p-3 rounded-lg shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={handleChatSubmit} className="p-4 border-t border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50">
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading} className="shadow-lg">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* --- CHAT BUBBLE (FAB) --- */}
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-xl
                   transition-all duration-300 ease-in-out
                   hover:scale-110 active:scale-95"
        onClick={() => setIsOpen(prev => !prev)}
      >
        {/* Animate between icons */}
        <div className="relative h-7 w-7">
          <X className={`absolute top-0 left-0 h-7 w-7 transition-all duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
          <MessageSquare className={`absolute top-0 left-0 h-7 w-7 transition-all duration-300 ${isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
        </div>
      </Button>
    </>
  );
}