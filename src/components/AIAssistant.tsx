
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sparkles, Send, BrainCircuit, Loader2, Bot, User } from 'lucide-react';
import { Lead, Activity } from '@/lib/types';
import { summarizeLeadActivity } from '@/ai/flows/summarize-lead-activity';
import { suggestLeadNextAction } from '@/ai/flows/suggest-lead-next-action';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAssistantProps {
  lead: Lead;
  activities: Activity[];
}

export default function AIAssistant({ lead, activities }: AIAssistantProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; reasoning?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (type: 'summarize' | 'suggest') => {
    setIsLoading(true);
    const userPrompt = type === 'summarize' ? "Summarize this lead's activity history." : "What should be my next action for this lead?";
    
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);

    try {
      if (type === 'summarize') {
        const result = await summarizeLeadActivity({ lead, activities });
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
      } else {
        const result = await suggestLeadNextAction({ lead, activities });
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.suggestedAction, 
          reasoning: result.reasoning 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">AI Sales Copilot</CardTitle>
          </div>
          <BrainCircuit className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>Systematic reasoning for smarter sales outcomes.</CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
            <Bot className="h-12 w-12 text-primary/40" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Ready to assist your sales cycle</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Ask me to summarize history or suggest the next best action.
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
                <div className={`max-w-[85%] space-y-2 p-3 rounded-2xl text-sm ${
                  msg.role === 'assistant' 
                    ? 'bg-secondary text-secondary-foreground rounded-tl-none' 
                    : 'bg-primary text-primary-foreground rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.reasoning && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 mb-1">Reasoning Process</p>
                      <p className="text-xs italic text-muted-foreground/90">{msg.reasoning}</p>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary p-3 rounded-2xl rounded-tl-none text-sm italic text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Reasoning step-by-step...
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <CardFooter className="p-4 border-t border-border/50 bg-background/50 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs gap-1.5 h-10 border-primary/20 hover:bg-primary/5"
          onClick={() => handleAction('summarize')}
          disabled={isLoading}
        >
          <Bot className="h-3.5 w-3.5" />
          Summarize History
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1 text-xs gap-1.5 h-10 bg-primary shadow-lg shadow-primary/20"
          onClick={() => handleAction('suggest')}
          disabled={isLoading}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest Next Step
        </Button>
      </CardFooter>
    </Card>
  );
}
