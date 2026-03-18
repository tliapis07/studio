
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, DollarSign, Clock } from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

const STAGES: { label: string; value: LeadStatus; color: string }[] = [
  { label: 'New', value: 'new', color: 'bg-blue-500' },
  { label: 'Contacted', value: 'contacted', color: 'bg-amber-500' },
  { label: 'Qualified', value: 'qualified', color: 'bg-purple-500' },
  { label: 'Proposal', value: 'proposal', color: 'bg-pink-500' },
  { label: 'Negotiated', value: 'negotiated', color: 'bg-indigo-500' },
  { label: 'Won', value: 'won', color: 'bg-emerald-500' },
];

export default function PipelinePage() {
  const { user } = useUser();
  const db = useFirestore();
  
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  const moveLead = (leadId: string, newStatus: LeadStatus) => {
    if (!db) return;
    const leadRef = doc(db, 'leads', leadId);
    updateDocumentNonBlocking(leadRef, { 
      status: newStatus,
      updatedAt: new Date()
    });
    toast({
      title: "Pipeline Updated",
      description: `Lead status changed to ${newStatus}`,
    });
  };

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Visual Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop leads to progress through your sales stages.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6">
        {STAGES.map((stage) => (
          <div key={stage.value} className="flex flex-col gap-4 min-w-[300px] w-[300px]">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {leads?.filter(l => l.status === stage.value).length || 0}
              </Badge>
            </div>
            
            <div className="flex-1 flex flex-col gap-3 p-2 rounded-xl bg-muted/20 border border-dashed border-border/50 min-h-[600px]">
              {leads?.filter(l => l.status === stage.value).map((lead) => (
                <Card 
                  key={lead.id} 
                  className="group shadow-none hover:shadow-lg transition-all border-border/50 cursor-grab active:cursor-grabbing"
                >
                  <CardHeader className="p-3 pb-2 space-y-0">
                    <div className="flex justify-between items-start">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-sm font-bold group-hover:text-primary hover:underline">
                        {lead.name}
                      </Link>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{lead.leadScore}</Badge>
                    </div>
                    <CardDescription className="text-[11px] font-medium">{lead.company}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-semibold text-foreground">${lead.dealValue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{lead.source}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {lead.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{tag}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-1">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px]"
                        onClick={() => {
                          const currentIndex = STAGES.findIndex(s => s.value === lead.status);
                          if (currentIndex > 0) moveLead(lead.id, STAGES[currentIndex - 1].value);
                        }}
                        disabled={STAGES.findIndex(s => s.value === lead.status) === 0}
                       >
                         Previous
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px]"
                        onClick={() => {
                          const currentIndex = STAGES.findIndex(s => s.value === lead.status);
                          if (currentIndex < STAGES.length - 1) moveLead(lead.id, STAGES[currentIndex + 1].value);
                        }}
                        disabled={STAGES.findIndex(s => s.value === lead.status) === STAGES.length - 1}
                       >
                         Next
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {leads?.filter(l => l.status === stage.value).length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/30 italic text-xs">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
