
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Plus, 
  History, 
  FileText,
  User,
  ArrowLeft,
  Settings2,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant';
import { Lead, Activity } from '@/lib/types';

// Mock data for a single lead
const lead: Lead = {
  id: '1',
  ownerUid: 'user1',
  name: 'Sarah Jenkins',
  email: 'sarah.j@acme.com',
  phone: '+1 555-0101',
  company: 'Acme Corp',
  status: 'proposal',
  tags: ['enterprise', 'high-value'],
  leadScore: 85,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date(),
  customFields: { "Role": "VP of Sales", "Budget": "$50k-$100k" },
  notesCount: 4,
  callsCount: 2,
};

const activities: Activity[] = [
  {
    id: 'a1',
    leadId: '1',
    type: 'call',
    content: 'Discovery call with Sarah. She is interested in the enterprise tier and wants a detailed proposal by Friday. Focus on data security.',
    createdAt: new Date('2024-02-15T14:30:00'),
  },
  {
    id: 'a2',
    leadId: '1',
    type: 'status_change',
    content: 'Lead moved from Qualified to Proposal stage.',
    oldStatus: 'qualified',
    newStatus: 'proposal',
    createdAt: new Date('2024-02-16T09:15:00'),
  },
  {
    id: 'a3',
    leadId: '1',
    type: 'note',
    content: 'Internal Review: Proposal draft completed. Sent to legal for final check.',
    createdAt: new Date('2024-02-17T11:00:00'),
  },
];

export default function LeadDetailPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard/leads"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-headline">{lead.name}</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{lead.status.toUpperCase()}</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" /> Manage
              </Button>
              <Button size="sm" className="bg-primary shadow-lg shadow-primary/20 gap-2">
                <Phone className="h-4 w-4" /> Log Call
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-1">
            <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {lead.company}</span>
            <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Mail className="h-4 w-4" /> {lead.email}</span>
            <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Created {lead.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <Tabs defaultValue="activity">
              <CardHeader className="p-0 border-b border-border/50">
                <TabsList className="bg-transparent h-14 w-full justify-start rounded-none px-6">
                  <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none">Activity Timeline</TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary h-full px-6 rounded-none">Lead Details</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-6">
                <TabsContent value="activity" className="m-0 space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Latest Updates</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                      <Plus className="h-3 w-3" /> Add Note
                    </Button>
                  </div>
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-primary/20 before:via-border/50 before:to-transparent">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative flex items-start pl-10 gap-4 group">
                        <div className={`absolute left-0 mt-1 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center shrink-0 z-10 ${
                          activity.type === 'call' ? 'bg-primary' : activity.type === 'status_change' ? 'bg-accent' : 'bg-secondary'
                        }`}>
                          {activity.type === 'call' ? <Phone className="h-3 w-3 text-white" /> : 
                           activity.type === 'status_change' ? <History className="h-3 w-3 text-background" /> : 
                           <FileText className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold capitalize">{activity.type.replace('_', ' ')}</h4>
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{activity.createdAt.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{activity.content}</p>
                          {activity.newStatus && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <Badge variant="outline" className="text-[10px] font-normal">{activity.oldStatus}</Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">{activity.newStatus}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="details" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Info</h4>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Email Address</span>
                          <span className="text-sm font-medium">{lead.email}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Phone Number</span>
                          <span className="text-sm font-medium">{lead.phone}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Company Website</span>
                          <span className="text-sm font-medium">www.acme.com</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qualification</h4>
                      <div className="space-y-3">
                        {Object.entries(lead.customFields).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs text-muted-foreground">{key}</span>
                            <span className="text-sm font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags</h4>
                    <div className="flex gap-2">
                      {lead.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 px-3">
                          <Tag className="h-3 w-3" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black text-primary font-headline leading-none">{lead.leadScore}</span>
                <span className="text-sm text-muted-foreground pb-1">/ 100</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${lead.leadScore}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Highly qualified lead based on company size and interaction frequency.
              </p>
            </CardContent>
          </Card>

          <div className="sticky top-6">
            <AIAssistant lead={lead} activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Target({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
