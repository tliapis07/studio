
'use client';

import { useState, useMemo, useRef } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, query, where, serverTimestamp } from 'firebase/firestore';
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Filter, 
  FileUp,
  Download,
  Users,
  Trash2,
  Building2,
  Clock,
  History,
  Mail,
  ArrowUpRight
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const STATUS_OPTIONS: { label: string; value: LeadStatus; color: string }[] = [
  { label: 'New', value: 'new', color: 'bg-blue-500/10 text-blue-500' },
  { label: 'Contacted', value: 'contacted', color: 'bg-amber-500/10 text-amber-500' },
  { label: 'Qualified', value: 'qualified', color: 'bg-purple-500/10 text-purple-500' },
  { label: 'Proposal', value: 'proposal', color: 'bg-pink-500/10 text-pink-500' },
  { label: 'Negotiated', value: 'negotiated', color: 'bg-indigo-500/10 text-indigo-500' },
  { label: 'Won', value: 'won', color: 'bg-emerald-500/10 text-emerald-500' },
  { label: 'Lost', value: 'lost', color: 'bg-rose-500/10 text-rose-500' },
];

const SOURCE_OPTIONS = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Event'];

export default function LeadsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || 
                            lead.company?.toLowerCase().includes(search.toLowerCase()) ||
                            lead.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const newLead = {
      ownerUid: user.uid,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      status: 'new' as LeadStatus,
      dealValue: Number(formData.get('dealValue')) || 0,
      source: formData.get('source') as string,
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notesCount: 0,
      callsCount: 0,
      customFields: {}
    };

    addDocumentNonBlocking(collection(db, 'leads'), newLead);
    setIsAddModalOpen(false);
    toast({ title: "Lead Added", description: `${newLead.name} added to your pipeline.` });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Leads</h1>
          <p className="text-muted-foreground">Manage relationships and prospect data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4" /> Import CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>Quick entry for a new prospect.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Company" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="email@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dealValue">Deal Value ($)</Label>
                    <Input id="dealValue" name="dealValue" type="number" placeholder="5000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select name="source" defaultValue="Website">
                      <SelectTrigger>
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Create Lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-card/30 p-3 rounded-xl border border-border/50 sticky top-[72px] z-20 backdrop-blur-md">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-10 bg-background/50 h-10 rounded-lg" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background/50">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/30 border-border/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[40px] px-4">
                  <Checkbox 
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={() => setSelectedLeads(selectedLeads.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id))}
                  />
                </TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead className="hidden xl:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Clock className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium">Synchronizing...</span>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/10 group cursor-pointer" onClick={() => setViewingLead(lead)}>
                  <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => setSelectedLeads(prev => prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id])}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] font-black uppercase ${STATUS_OPTIONS.find(s => s.value === lead.status)?.color}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {lead.company}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-black text-primary">
                    ${lead.dealValue?.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-[10px] text-muted-foreground font-bold">
                    {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingLead(lead)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Log Activity</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-500">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!viewingLead} onOpenChange={() => setViewingLead(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] md:h-[80vh] bg-card/95 backdrop-blur-2xl border-border/50 flex flex-col p-0 overflow-hidden sm:rounded-2xl">
          {viewingLead && (
            <>
              <div className="p-6 md:p-8 border-b border-border/50 bg-primary/5">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl md:text-3xl font-bold font-headline">{viewingLead.name}</h2>
                      <Badge className={STATUS_OPTIONS.find(s => s.value === viewingLead.status)?.color}>{viewingLead.status.toUpperCase()}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {viewingLead.company}</span>
                      <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {viewingLead.email}</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto p-4 bg-background/50 rounded-xl border border-border/50 md:bg-transparent md:border-none">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Est. Deal Value</p>
                    <p className="text-3xl font-black text-primary">${viewingLead.dealValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <History className="h-4 w-4" /> Activity Feed
                      </h3>
                      <div className="space-y-4 border-l-2 border-muted pl-6 ml-2 pt-2">
                         {[
                           { title: 'Discovery Call', desc: 'Strong interest in enterprise tier.', time: 'Today, 10:45 AM', type: 'call' },
                           { title: 'Status Update', desc: 'Moved to Proposal Stage.', time: 'Yesterday, 4:20 PM', type: 'status' }
                         ].map((item, i) => (
                           <div key={i} className="relative">
                             <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-card ${item.type === 'call' ? 'bg-primary' : 'bg-accent'}`} />
                             <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                               <p className="text-sm font-bold">{item.title}</p>
                               <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                               <span className="text-[10px] text-muted-foreground font-bold mt-2 block uppercase tracking-widest">{item.time}</span>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                         <ArrowUpRight className="h-12 w-12" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <History className="h-4 w-4 text-primary" />
                           <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Close Probability</h3>
                        </div>
                        <div className="flex items-end gap-2">
                           <span className="text-5xl font-black text-primary leading-none">82%</span>
                           <Badge variant="outline" className="mb-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">HIGH</Badge>
                        </div>
                        <div className="space-y-1 pt-2">
                           <p className="text-[11px] font-bold text-muted-foreground uppercase">AI Insight</p>
                           <p className="text-xs italic leading-relaxed">Engagement velocity is 40% higher than average.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-background/80 flex flex-col md:flex-row justify-end gap-2 sticky bottom-0 z-10 backdrop-blur-md">
                <Button variant="ghost" className="w-full md:w-auto" onClick={() => setViewingLead(null)}>Close</Button>
                <Button className="w-full md:w-auto bg-primary shadow-xl shadow-primary/20 font-bold">Edit Profile</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
