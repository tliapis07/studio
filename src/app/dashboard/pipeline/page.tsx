
'use client';

import { useState } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Users, Target } from 'lucide-react';
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
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  
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
      updatedAt: serverTimestamp()
    });
    toast({
      title: "Pipeline Updated",
      description: `Lead moved to ${newStatus.toUpperCase()}`,
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLead(id);
    e.dataTransfer.setData('leadId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (id) moveLead(id, status);
    setDraggedLead(null);
  };

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Pipeline</h1>
          <p className="text-muted-foreground">Manage deal velocity and visual stages.</p>
        </div>
        <Button className="gap-2 bg-primary">
          <Plus className="h-4 w-4" /> New Deal
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 h-[calc(100vh-14rem)]">
        {STAGES.map((stage) => (
          <div 
            key={stage.value} 
            className="flex flex-col gap-4 min-w-[320px] w-[320px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.value)}
          >
            <div className="flex items-center justify-between px-2 bg-card/20 p-2 rounded-t-lg border-b-2 border-primary/20">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color} animate-pulse`} />
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{stage.label}</h3>
              </div>
              <Badge variant="secondary" className="rounded-full bg-background/50 border-border/50 text-[10px] font-bold h-6 w-6 flex items-center justify-center p-0">
                {leads?.filter(l => l.status === stage.value).length || 0}
              </Badge>
            </div>
            
            <div className={`flex-1 flex flex-col gap-3 p-3 rounded-b-xl bg-muted/10 border-x border-b border-border/20 transition-colors ${draggedLead ? 'bg-primary/5 border-dashed border-primary/30' : ''}`}>
              {leads?.filter(l => l.status === stage.value).map((lead) => (
                <Card 
                  key={lead.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={`group shadow-none hover:shadow-xl hover:-translate-y-1 transition-all border-border/50 cursor-grab active:cursor-grabbing bg-card/60 backdrop-blur-sm ${draggedLead === lead.id ? 'opacity-40 grayscale' : ''}`}
                >
                  <CardHeader className="p-4 pb-2 space-y-0">
                    <div className="flex justify-between items-start">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-sm font-bold group-hover:text-primary transition-colors">
                        {lead.name}
                      </Link>
                    </div>
                    <CardDescription className="text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {lead.company}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black text-foreground">${lead.dealValue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold">
                        <Target className="h-3 w-3" />
                        <span>{lead.source}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
