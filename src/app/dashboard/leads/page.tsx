
'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ExternalLink,
  Layers,
  List as ListIcon
} from 'lucide-react';
import Link from 'next/link';
import { Lead } from '@/lib/types';

const mockLeads: Lead[] = [
  {
    id: '1',
    ownerUid: 'user1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@acme.com',
    phone: '+1 555-0101',
    company: 'Acme Corp',
    status: 'proposal',
    tags: ['enterprise', 'high-value'],
    leadScore: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    customFields: {},
    notesCount: 4,
    callsCount: 2,
  },
  {
    id: '2',
    ownerUid: 'user1',
    name: 'Mark Wilson',
    email: 'mark@startuptips.io',
    phone: '+1 555-0102',
    company: 'StartupTips',
    status: 'contacted',
    tags: ['smb'],
    leadScore: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
    customFields: {},
    notesCount: 2,
    callsCount: 1,
  },
  {
    id: '3',
    ownerUid: 'user1',
    name: 'James Rodriguez',
    email: 'james@globalfin.com',
    company: 'Global Financial',
    status: 'qualified',
    tags: ['financial-services'],
    leadScore: 72,
    createdAt: new Date(),
    updatedAt: new Date(),
    customFields: {},
    notesCount: 0,
    callsCount: 3,
  }
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contacted: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  proposal: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  lost: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function LeadsPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lead Pipeline</h1>
          <p className="text-muted-foreground">Monitor and progress your prospects through the sales funnel.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-border/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, company or email..." className="pl-10 bg-background/50 border-border/50 h-10" />
        </div>
        <Tabs defaultValue="list" onValueChange={(v) => setView(v as any)} className="w-auto">
          <TabsList className="bg-muted/50 p-1 h-10">
            <TabsTrigger value="list" className="gap-2 px-4 data-[state=active]:bg-background">
              <ListIcon className="h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2 px-4 data-[state=active]:bg-background">
              <Layers className="h-4 w-4" /> Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'list' ? (
        <Card className="bg-card/30 border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[250px]">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/10">
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/dashboard/leads/${lead.id}`} className="font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
                        {lead.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </Link>
                      <span className="text-xs text-muted-foreground">{lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{lead.company || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${lead.leadScore > 70 ? 'bg-emerald-500' : lead.leadScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${lead.leadScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{lead.leadScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> Follow-up Email
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/leads/${lead.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Log Activity</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-500">Delete Lead</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((status) => (
            <div key={status} className="flex flex-col gap-4 min-w-[280px]">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{status}</h3>
                <Badge variant="secondary" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {mockLeads.filter(l => l.status === status).length}
                </Badge>
              </div>
              <div className="flex flex-col gap-3 min-h-[500px] p-2 rounded-xl bg-muted/20 border border-dashed border-border/50">
                {mockLeads.filter(l => l.status === status).map((lead) => (
                  <Card key={lead.id} className="group shadow-none hover:shadow-lg transition-all border-border/50 cursor-pointer">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-bold group-hover:text-primary">{lead.name}</CardTitle>
                        <Badge className="text-[10px] h-4 px-1">{lead.leadScore}</Badge>
                      </div>
                      <CardDescription className="text-[11px] font-medium">{lead.company}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex gap-1 flex-wrap mt-2">
                        {lead.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
