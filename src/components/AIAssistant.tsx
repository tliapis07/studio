
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sparkles, Bot, User, X, Loader2, Mic, Send, MicOff } from 'lucide-react';
import { Lead, Activity } from '@/lib/types';
import { summarizeLeadActivity } from '@/ai/flows/summarize-lead-activity';
import { suggestLeadNextAction } from '@/ai/flows/suggest-lead-next-action';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface AIAssistantProps {
  lead?: Lead;
  activities?: Activity[];
  floating?: boolean;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

export default function AIAssistant({ lead, activities, floating = false, isOpenExternal, onCloseExternal }: AIAssistantProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; reasoning?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInput(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({ variant: 'destructive', title: 'Dictation Error', description: 'Could not access microphone.' });
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({ title: 'Unsupported', description: 'Dictation not supported in this browser.' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: 'Listening', description: 'Speak your command now...' });
    }
  };

  const handleAction = async (type: 'summarize' | 'suggest' | 'chat') => {
    if (type === 'chat' && !input.trim()) return;
    
    setIsLoading(true);
    const userPrompt = type === 'summarize' 
      ? "Summarize this lead's activity history." 
      : type === 'suggest' 
        ? "What should be the team's next action for this lead?" 
        : input;
    
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    if (type === 'chat') setInput('');
    if (isListening) recognitionRef.current?.stop();

    try {
      if (type === 'summarize' && lead && activities) {
        const result = await summarizeLeadActivity({ lead, activities });
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
      } else if (type === 'suggest' && lead && activities) {
        const result = await suggestLeadNextAction({ lead, activities });
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.suggestedAction, 
          reasoning: result.reasoning 
        }]);
      } else {
        // Mock general organizational help
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Partner, I've analyzed your organizational request. I can help assign leads, analyze bottlenecks, or summarize team performance. For example, try 'Show me the team win rate' or 'Summarize Sarah's recent activities'." 
          }]);
          setIsLoading(false);
        }, 1500);
        return;
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a processing error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`flex flex-col border-0 bg-transparent h-full`}>
      <CardHeader className="border-b border-border/50 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-headline">Partner Assistant</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">SalesStream AI</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={onCloseExternal}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary opacity-40" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">Ready for Guidance</p>
              <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                Dictate organizational tasks: "Assign Tesla to Sarah" or "Analyze pipeline bottlenecks".
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] space-y-2 p-3 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'assistant' 
                    ? 'bg-secondary text-secondary-foreground rounded-tl-none border border-border/50' 
                    : 'bg-primary text-primary-foreground rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.reasoning && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/80 mb-1">Reasoning</p>
                      <p className="text-[10px] italic text-muted-foreground/90">{msg.reasoning}</p>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary p-3 rounded-2xl rounded-tl-none text-[11px] italic text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <CardFooter className="p-4 border-t border-border/50 bg-background/50 flex flex-col gap-3">
        {lead && (
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1 text-[9px] font-bold uppercase tracking-widest h-8 rounded-xl" onClick={() => handleAction('summarize')}>Summarize</Button>
            <Button variant="outline" size="sm" className="flex-1 text-[9px] font-bold uppercase tracking-widest h-8 rounded-xl" onClick={() => handleAction('suggest')}>Next Step</Button>
          </div>
        )}
        <div className="flex gap-2 w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-10 w-10 shrink-0 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-primary'}`} 
            onClick={toggleListening}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <input 
            placeholder={isListening ? "Listening..." : "Dictate command..."}
            className="flex-1 text-xs h-10 px-3 rounded-xl bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:outline-none transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAction('chat')}
            disabled={isLoading}
          />
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20" onClick={() => handleAction('chat')} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
