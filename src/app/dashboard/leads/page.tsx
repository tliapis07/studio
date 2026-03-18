
'use client';

import { useState, useMemo } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Mail, 
  Phone, 
  ExternalLink,
  Download,
  Users,
  CheckCircle2,
  Trash2,
  Calendar,
  Building2,
  Clock,
  History
} from 'lucide-react';
import Link from 'next/link';
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
      leadScore: 50,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notesCount: 0,
      callsCount: 0,
      customFields: {}
    };

    addDocumentNonBlocking(collection(db, 'leads'), newLead);
    setIsAddModalOpen(false);
    toast({ title: "Lead Added", description: `${newLead.name} has been added to your pipeline.` });
  };

  const handleBulkDelete = () => {
    if (!db || selectedLeads.length === 0) return;
    selectedLeads.forEach(id => {
      deleteDocumentNonBlocking(doc(db, 'leads', id));
    });
    setSelectedLeads([]);
    toast({ variant: "destructive", title: "Leads Deleted", description: `${selectedLeads.length} leads removed.` });
  };

  const handleBulkQualify = () => {
    if (!db || selectedLeads.length === 0) return;
    selectedLeads.forEach(id => {
      updateDocumentNonBlocking(doc(db, 'leads', id), { status: 'qualified', updatedAt: serverTimestamp() });
    });
    setSelectedLeads([]);
    toast({ title: "Leads Qualified", description: `Selected leads moved to Qualified stage.` });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const exportToCSV = () => {
    const data = filteredLeads.filter(l => selectedLeads.includes(l.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Company,Status,Value,Source"].join(",") + "\n"
      + data.map(l => `${l.name},${l.company},${l.status},${l.dealValue},${l.source}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "salesstream_leads.csv");
    document.body.appendChild(link);
    link.click();
    toast({ title: "Export Complete", description: "CSV file has been downloaded." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lead Management</h1>
          <p className="text-muted-foreground">Manage your relationships and sales progression.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>Enter contact details to start tracking this prospect.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Acme Inc" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dealValue">Estimated Value ($)</Label>
                    <Input id="dealValue" name="dealValue" type="number" placeholder="5000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Lead Source</Label>
                    <Select name="source" defaultValue="Website">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Save Lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-border/50 sticky top-16 z-20 backdrop-blur-md">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-10 bg-background/50 h-10" 
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
              <SelectItem value="all">All Statuses</SelectItem>
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
        
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2 p-1 bg-primary/10 rounded-lg animate-in fade-in slide-in-from-right-2 w-full xl:w-auto">
            <span className="text-xs font-bold px-3 text-primary">{selectedLeads.length} Selected</span>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={handleBulkQualify}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Qualify
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={exportToCSV}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-rose-500 hover:text-rose-600" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card/30 border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Lead Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 animate-spin text-primary" />
                      <span>Fetching lead intelligence...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/10 group">
                  <TableCell>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleSelectLead(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <button 
                        onClick={() => setViewingLead(lead)}
                        className="font-bold text-sm text-left hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {lead.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{lead.email || 'No Email'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-bold ${STATUS_OPTIONS.find(s => s.value === lead.status)?.color}`}>
                      {lead.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {lead.company || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-primary">
                    ${lead.dealValue?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-xs">{lead.source}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingLead(lead)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Log Call</DropdownMenuItem>
                        <DropdownMenuItem>Send Email</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(db!, 'leads', lead.id))}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No leads found matching your criteria.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Lead Detail Modal */}
      <Dialog open={!!viewingLead} onOpenChange={() => setViewingLead(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] bg-card/90 backdrop-blur-xl border-border/50 flex flex-col p-0 overflow-hidden">
          {viewingLead && (
            <>
              <div className="p-8 border-b border-border/50 bg-primary/5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold font-headline">{viewingLead.name}</h2>
                      <Badge className={STATUS_OPTIONS.find(s => s.value === viewingLead.status)?.color}>{viewingLead.status.toUpperCase()}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {viewingLead.company}</span>
                      <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {viewingLead.email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {viewingLead.phone || 'No Phone'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Deal Value</p>
                    <p className="text-3xl font-black text-primary">${viewingLead.dealValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <History className="h-4 w-4" /> Activity History
                        </h3>
                        <Button size="sm" variant="outline" className="h-8 text-xs">Add Note</Button>
                      </div>
                      <div className="space-y-4 border-l-2 border-muted pl-6 ml-2">
                         <div className="relative">
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-card" />
                            <div className="space-y-1 bg-muted/30 p-4 rounded-xl">
                               <p className="text-sm font-bold">Discovery Call Completed</p>
                               <p className="text-xs text-muted-foreground">Prospect expressed strong interest in enterprise deployment. Budget approved.</p>
                               <span className="text-[10px] text-muted-foreground block mt-2">Today, 10:45 AM</span>
                            </div>
                         </div>
                         <div className="relative">
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-accent border-4 border-card" />
                            <div className="space-y-1 bg-muted/30 p-4 rounded-xl">
                               <p className="text-sm font-bold">Status Updated: Proposal</p>
                               <p className="text-xs text-muted-foreground">Lead moved from Qualified to Proposal stage after demo.</p>
                               <span className="text-[10px] text-muted-foreground block mt-2">Yesterday, 4:20 PM</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lead Intelligence</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Engagement Score</p>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '85%' }} />
                             </div>
                             <span className="text-sm font-bold">85%</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-2">
                           <p className="text-xs text-muted-foreground">Next Suggested Step</p>
                           <p className="text-sm font-medium">Send contractual draft and schedule final pricing review.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Metadata</p>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-muted/30 rounded-lg">
                             <span className="text-muted-foreground block">Created</span>
                             <span className="font-medium">Jan 12, 2024</span>
                          </div>
                          <div className="p-2 bg-muted/30 rounded-lg">
                             <span className="text-muted-foreground block">Source</span>
                             <span className="font-medium">{viewingLead.source}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-background/50 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setViewingLead(null)}>Close</Button>
                <Button className="bg-primary shadow-lg shadow-primary/20">Edit Lead Profile</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
