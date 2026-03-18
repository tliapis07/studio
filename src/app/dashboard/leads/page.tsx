'use client';

import { useState, useMemo } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Filter, 
  FileUp,
  Building2,
  Clock,
  UserCheck,
  UserPlus,
  Download
} from 'lucide-react';
import { Lead, LeadStatus, TeamMember } from '@/lib/types';
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

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function LeadsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'));
  }, [db, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || 
                            lead.company?.toLowerCase().includes(search.toLowerCase()) ||
                            lead.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesRep = repFilter === 'all' || lead.ownerUid === repFilter;
      return matchesSearch && matchesStatus && matchesRep;
    });
  }, [leads, search, statusFilter, repFilter]);

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;

    const formData = new FormData(e.currentTarget);
    const newLead = {
      ownerUid: formData.get('assignTo') as string || user?.uid || 'user1',
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      status: 'new' as LeadStatus,
      dealValue: Number(formData.get('dealValue')) || 0,
      source: 'Direct',
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notesCount: 0,
      callsCount: 0,
      customFields: {}
    };

    addDocumentNonBlocking(collection(db, 'leads'), newLead);
    setIsAddModalOpen(false);
    toast({ title: "Lead Added", description: `${newLead.name} assigned to the team.` });
  };

  const handleAssignToRep = (repId: string) => {
    if (!db || selectedLeads.length === 0) return;
    
    selectedLeads.forEach(leadId => {
      const leadRef = doc(db, 'leads', leadId);
      updateDocumentNonBlocking(leadRef, { ownerUid: repId, updatedAt: serverTimestamp() });
    });

    const repName = MOCK_TEAM.find(m => m.id === repId)?.name;
    toast({ title: "Leads Assigned", description: `${selectedLeads.length} leads assigned to ${repName}.` });
    setSelectedLeads([]);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Leads</h1>
          <p className="text-muted-foreground">Manage collective relationships and organizational prospect data.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedLeads.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-accent/10 border-accent/20 text-accent">
                  <UserPlus className="h-4 w-4" /> Assign {selectedLeads.length} Selected
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Choose Representative</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MOCK_TEAM.map(rep => (
                  <DropdownMenuItem key={rep.id} onClick={() => handleAssignToRep(rep.id)}>
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={rep.avatar} />
                      <AvatarFallback>{rep.name[0]}</AvatarFallback>
                    </Avatar>
                    {rep.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 h-9">
            <Download className="h-4 w-4 text-primary" /> Export Leads
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 h-9 hidden md:flex">
            <FileUp className="h-4 w-4 text-primary" /> Import CSV
          </Button>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 h-9">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle>Create New Team Lead</DialogTitle>
                <DialogDescription>Enter a new prospect and assign it to a team member.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="Lead Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Acme Inc" />
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
                    <Label htmlFor="assignTo">Assign To Rep</Label>
                    <Select name="assignTo" defaultValue="user1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Rep" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full shadow-lg shadow-primary/20 font-bold h-11">Create and Assign</Button>
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
              placeholder="Search team leads..." 
              className="pl-10 bg-background/50 h-10 rounded-lg" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background/50 h-10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={repFilter} onValueChange={setRepFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background/50 h-10">
              <UserCheck className="h-4 w-4 mr-2" />
              <SelectValue placeholder="By Rep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team</SelectItem>
              {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/30 border-border/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[40px] px-4 text-center">
                  <Checkbox 
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={() => setSelectedLeads(selectedLeads.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id))}
                  />
                </TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Assigned Rep</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead className="hidden xl:table-cell">Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Clock className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium">Loading Team Records...</span>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/10 group cursor-pointer" onClick={() => setViewingLead(lead)}>
                  <TableCell className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => setSelectedLeads(prev => prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id])}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{lead.company || lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${STATUS_OPTIONS.find(s => s.value === lead.status)?.color}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={MOCK_TEAM.find(m => m.id === lead.ownerUid)?.avatar} />
                        <AvatarFallback className="text-[10px]">{MOCK_TEAM.find(m => m.id === lead.ownerUid)?.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-muted-foreground">{MOCK_TEAM.find(m => m.id === lead.ownerUid)?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-black text-primary">
                    ${lead.dealValue?.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {lead.source}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingLead(lead)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Assign New Owner</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-500">Archive Record</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No leads found matching your team filters.
                  </TableCell>
                </TableRow>
              )}
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
                      <span className="flex items-center gap-1.5 font-bold"><Building2 className="h-4 w-4" /> {viewingLead.company}</span>
                      <span className="flex items-center gap-1.5 font-bold"><UserCheck className="h-4 w-4 text-accent" /> Assigned: {MOCK_TEAM.find(m => m.id === viewingLead.ownerUid)?.name}</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto p-4 bg-background/50 rounded-xl border border-border/50 md:bg-transparent md:border-none">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Team Deal Value</p>
                    <p className="text-3xl font-black text-primary">${viewingLead.dealValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border/50 bg-background/80 flex flex-col md:flex-row justify-end gap-2 sticky bottom-0 z-10 backdrop-blur-md">
                <Button variant="ghost" className="w-full md:w-auto h-11" onClick={() => setViewingLead(null)}>Close</Button>
                <Button className="w-full md:w-auto bg-primary shadow-xl shadow-primary/20 font-bold h-11">Manage Assignment</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
