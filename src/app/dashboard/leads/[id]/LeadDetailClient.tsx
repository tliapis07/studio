'use client';

/**
 * @fileOverview Enhanced Lead Detail Client Component
 * 
 * Features:
 * - Real-time sync with ownerUid isolation
 * - AI Activity Summarization
 * - AI Suggested Next Action
 * - Commits AI results to Activity Feed
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Plus, 
  User, 
  ArrowLeft, 
  MessageCircle, 
  Bell, 
  Clock,
  Sparkles,
  Loader2,
  FileText,
  History
} from 'lucide-react';
import Link from 'next/link';
import { Lead, Activity } from '@/lib/types';
import { useDoc, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { format, isValid } from 'date-fns';
import { summarizeLeadActivity } from '@/ai/flows/summarize-lead-activity';
import { suggestLeadNextAction } from '@/ai/flows/suggest-lead-next-action';

export default function LeadDetailClient({ id }: { id: string }) {
  const db = useFirestore();
  const { user } = useUser();
  const [followUpDate, setFollowUpDate] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const leadRefStable = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'leads', id);
  }, [db, id]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    // Removed orderBy to avoid missing index errors during development.
    // Query must filter by ownerUid AND target collection path correctly.
    return query(
      collection(db, 'activities'), 
      where('ownerUid', '==', user.uid),
      where('leadId', '==', id)
    );
  }, [db, id, user?.uid]);

  const leadResult = useDoc<Lead>(leadRefStable);
  const { data: rawActivities } = useCollection<Activity>(activitiesQuery);
  const lead = leadResult.data;

  // Sorting activities client-side to resolve missing composite index requirement
  const sortedActivities = useMemo(() => {
    if (!rawActivities) return [];
    return [...rawActivities].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawActivities]);

  const handleSetFollowUp = () => {
    if (!db || !lead || !followUpDate) return;
    const date = new Date(followUpDate);
    
    if (!isValid(date)) {
      toast({ variant: "destructive", title: "Invalid Date", description: "Please select a valid follow-up time." });
      return;
    }

    updateDocumentNonBlocking(doc(db, 'leads', lead.id), {
      nextFollowUpAt: date,
      updatedAt: serverTimestamp(),
    });

    addDocumentNonBlocking(collection(db, 'calendarEvents'), {
      ownerUid: user?.uid || lead.ownerUid,
      leadId: lead.id,
      title: `Follow-up: ${lead.name}`,
      description: `Automated follow-up reminder for ${lead.company}`,
      startAt: date,
      eventType: 'follow-up',
      status: 'scheduled',
      allDay: false,
      createdAt: serverTimestamp(),
    });

    toast({ title: "Follow-up Scheduled", description: `Reminder set for ${format(date, 'PPP p')}` });
    setFollowUpDate('');
  };

  const runAiSummarize = async () => {
    if (!lead || !user) return;
    setIsAiProcessing(true);
    try {
      const summary = await summarizeLeadActivity({ lead, activities: sortedActivities || [] });
      addDocumentNonBlocking(collection(db, 'activities'), {
        leadId: lead.id,
        ownerUid: user.uid,
        ownerName: user.displayName || 'Partner AI',
        type: 'ai_summary',
        content: `AI SUMMARY: ${summary}`,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Intelligence Captured", description: "Activity summary added to feed." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Strategy Error", description: "Could not generate summary." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const runAiNextAction = async () => {
    if (!lead || !user) return;
    setIsAiProcessing(true);
    try {
      const result = await suggestLeadNextAction({ lead, activities: sortedActivities || [] });
      addDocumentNonBlocking(collection(db, 'activities'), {
        leadId: lead.id,
        ownerUid: user.uid,
        ownerName: user.displayName || 'Partner AI',
        type: 'ai_summary',
        content: `SUGGESTED ACTION: ${result.suggestedAction}\n\nREASONING: ${result.reasoning}`,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Strategy Updated", description: "Suggested action added to feed." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Strategy Error", description: "Could not suggest next step." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=Hi ${lead?.name}, I'm following up from SalesStream.`, '_blank');
    
    if (db && user && lead) {
      addDocumentNonBlocking(collection(db, 'activities'), {
        leadId: lead.id,
        ownerUid: user.uid,
        ownerName: user.displayName || 'Partner',
        type: 'whatsapp_sent',
        content: `Sent WhatsApp message to ${lead.name}`,
        createdAt: serverTimestamp(),
      });
    }
  };

  if (leadResult.isLoading) return <div className="p-20 text-center italic text-muted-foreground flex flex-col items-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /> Synchronizing lead data...</div>;
  if (!lead) return <div className="p-8 text-center py-20"><p className="text-xl font-bold mb-4">Lead not found.</p><Button asChild variant="outline"><Link href="/dashboard/leads">Return to Pipeline</Link></Button></div>;

  const displayFollowUp = lead.nextFollowUpAt?.toDate ? format(lead.nextFollowUpAt.toDate(), 'PPP p') : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl bg-card border">
          <Link href="/dashboard/leads"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black font-headline tracking-tight text-primary">{lead.name}</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]">{lead.status}</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(lead.phone)} className="gap-2 text-emerald-500 hover:bg-emerald-500/10 h-10 border-emerald-500/20 rounded-xl">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button size="sm" className="bg-primary shadow-lg shadow-primary/20 gap-2 h-10 px-6 rounded-xl font-black uppercase text-[10px]">
                <Phone className="h-4 w-4" /> Log Call
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"><Building2 className="h-3 w-3" /> {lead.company}</span>
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"><Mail className="h-3 w-3" /> {lead.email}</span>
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"><Calendar className="h-3 w-3" /> {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'PP') : 'Recently'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="bg-primary/5 border-primary/20 border-2 shadow-sm rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"><Bell className="h-4 w-4" /> Automation: Follow-up</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {displayFollowUp ? (
                  <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span className="text-sm font-black">{displayFollowUp}</span></div>
                    <Button variant="ghost" size="sm" onClick={() => updateDocumentNonBlocking(doc(db, 'leads', lead.id), { nextFollowUpAt: null })} className="text-rose-500 font-black uppercase text-[10px]">Clear</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input type="datetime-local" className="bg-background border-2 border-primary/10 h-11 rounded-xl" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                    <Button onClick={handleSetFollowUp} size="sm" className="bg-primary px-6 h-11 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg">Set</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-accent/5 border-accent/20 border-2 shadow-sm rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2"><Sparkles className="h-4 w-4" /> Strategic Partner AI</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" disabled={isAiProcessing} onClick={runAiSummarize} className="flex-1 h-11 text-[9px] font-black uppercase border-accent/20 bg-background hover:bg-accent/10 rounded-xl">
                  {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3 mr-2" />} Summarize
                </Button>
                <Button variant="outline" disabled={isAiProcessing} onClick={runAiNextAction} className="flex-1 h-11 text-[9px] font-black uppercase border-accent/20 bg-background hover:bg-accent/10 rounded-xl">
                  {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-2" />} Next Action
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-xl">
            <Tabs defaultValue="activity">
              <CardHeader className="p-0 border-b border-border/50 bg-muted/20">
                <TabsList className="bg-transparent h-14 w-full justify-start rounded-none px-6">
                  <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none text-[10px] font-black uppercase tracking-widest gap-2"><History className="h-3.5 w-3.5" /> Activity Feed</TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none text-[10px] font-black uppercase tracking-widest gap-2"><User className="h-3.5 w-3.5" /> Prospect Profile</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-8">
                <TabsContent value="activity" className="m-0 space-y-6">
                  {sortedActivities && sortedActivities.length > 0 ? sortedActivities.map((a) => (
                    <div key={a.id} className={`p-5 rounded-2xl border-2 transition-all ${a.type === 'ai_summary' ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">{a.type.replace('_', ' ')}</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{a.createdAt?.toDate ? format(a.createdAt.toDate(), 'MMM d, p') : 'Recently'}</span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    </div>
                  )) : <div className="text-center py-20 text-muted-foreground italic text-sm">No historical logs recorded. Run AI Strategy to begin.</div>}
                </TabsContent>
                <TabsContent value="details" className="m-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Organizational Attributes</h4>
                      <div className="space-y-4">
                        <div className="flex flex-col"><span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Pipeline Origin</span><span className="text-sm font-bold">{lead.source || 'Direct Ingestion'}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Initial Value</span><span className="text-sm font-black text-primary">${lead.dealValue?.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary/5 border-primary/20 border-2 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/10 p-6"><CardTitle className="text-11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles className="h-4 w-4" /> Organizational Score</CardTitle></CardHeader>
            <CardContent className="p-8">
              <div className="flex items-end gap-2 mb-6">
                <span className="text-6xl font-black text-primary font-headline leading-none">{lead.leadScore || 82}</span>
                <span className="text-xs text-muted-foreground pb-1 font-bold uppercase tracking-widest">/ 100</span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden border-2 border-border/50">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--primary),0.5)]" style={{ width: `${lead.leadScore || 82}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-6 italic leading-relaxed font-medium">Strategic health based on engagement velocity and organizational sentiment data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
