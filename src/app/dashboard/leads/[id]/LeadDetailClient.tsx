'use client';

/**
 * @fileOverview Lead Detail Client Component
 * 
 * Handles all interactive logic for lead management, including:
 * - Real-time data synchronization with Firestore
 * - Follow-up automation scheduling
 * - WhatsApp integration
 * - Activity logging
 * - AI Assistant context providing
 */

import { useState } from 'react';
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
  Clock 
} from 'lucide-react';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant';
import { Lead } from '@/lib/types';
import { useDoc, useFirestore, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function LeadDetailClient({ id }: { id: string }) {
  const db = useFirestore();
  const { user } = useUser();
  const [followUpDate, setFollowUpDate] = useState('');

  const leadRef = useDoc<Lead>(doc(db, 'leads', id));
  const lead = leadRef.data;

  const handleSetFollowUp = () => {
    if (!db || !lead || !followUpDate) return;
    const date = new Date(followUpDate);
    
    // Update lead follow-up
    updateDocumentNonBlocking(doc(db, 'leads', lead.id), {
      nextFollowUpAt: date,
      updatedAt: serverTimestamp(),
    });

    // Auto-add calendar event
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

    toast({
      title: "Follow-up Scheduled",
      description: `Reminder and calendar event set for ${format(date, 'PPP p')}`,
    });
    setFollowUpDate('');
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=Hi ${lead?.name}, I'm following up from SalesStream.`, '_blank');
    
    // Log WhatsApp activity
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

  if (leadRef.isLoading) return <div className="p-8 text-center italic text-muted-foreground">Synchronizing lead data...</div>;
  if (!lead) return <div className="p-8 text-center">Lead not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard/leads"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black font-headline">{lead.name}</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]">{lead.status}</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(lead.phone)} className="gap-2 text-emerald-500 hover:bg-emerald-500/10 h-10 border-emerald-500/20">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button size="sm" className="bg-primary shadow-lg shadow-primary/20 gap-2 h-10">
                <Phone className="h-4 w-4" /> Log Call
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-1">
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"><Building2 className="h-3 w-3" /> {lead.company}</span>
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"><Mail className="h-3 w-3" /> {lead.email}</span>
            <span className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="h-3 w-3" /> 
              {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'PP') : 'Recently'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20 border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Automation: Next Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.nextFollowUpAt ? (
                  <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-sm font-black">
                        {format(lead.nextFollowUpAt.toDate ? lead.nextFollowUpAt.toDate() : new Date(lead.nextFollowUpAt), 'PPP p')}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => updateDocumentNonBlocking(doc(db, 'leads', lead.id), { nextFollowUpAt: null })} className="text-rose-500 font-bold uppercase text-[10px]">Clear</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="datetime-local" 
                      className="bg-background border-2 border-primary/10 h-10"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                    <Button onClick={handleSetFollowUp} size="sm" className="bg-primary px-6 h-10 font-black uppercase tracking-widest text-[10px]">Set</Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground font-medium italic">Setting a date auto-syncs with your team calendar and triggers a sync notification.</p>
              </CardContent>
            </Card>

            <Card className="bg-accent/5 border-accent/20 border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                  <User className="h-4 w-4" /> Assigned Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center font-black text-accent">P</div>
                  <div>
                    <p className="text-sm font-black">{lead.ownerName || 'Partner Organization'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Lead Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-2 border-border/50 rounded-2xl overflow-hidden shadow-xl">
            <Tabs defaultValue="activity">
              <CardHeader className="p-0 border-b border-border/50 bg-muted/20">
                <TabsList className="bg-transparent h-14 w-full justify-start rounded-none px-6">
                  <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none text-[10px] font-black uppercase tracking-widest">Activity Timeline</TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none text-[10px] font-black uppercase tracking-widest">Lead Details</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-8">
                <TabsContent value="activity" className="m-0 space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Historical Logs</h3>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 gap-2 bg-muted/50 rounded-lg">
                      <Plus className="h-3 w-3" /> Add Note
                    </Button>
                  </div>
                  <div className="text-center py-12 text-muted-foreground italic text-sm">No activity logs recorded yet.</div>
                </TabsContent>
                <TabsContent value="details" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Client Information</h4>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Email</span>
                          <span className="text-sm font-bold">{lead.email}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Phone</span>
                          <span className="text-sm font-bold">{lead.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 border-2 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/10">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" /> Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-primary font-headline leading-none">{lead.leadScore || 88}</span>
                <span className="text-xs text-muted-foreground pb-1 font-bold uppercase">/ 100</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000" 
                  style={{ width: `${lead.leadScore || 88}%` }} 
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 italic leading-relaxed font-medium">
                High-intent profile based on organizational engagement velocity.
              </p>
            </CardContent>
          </Card>

          <div className="sticky top-20">
            <AIAssistant lead={lead} activities={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
