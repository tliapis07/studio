'use client';

import { useState, useMemo, useRef } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, serverTimestamp, doc, where } from 'firebase/firestore';
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
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon
} from 'lucide-react';
import { Lead, LeadStatus, TeamMember } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';

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

const LEAD_FIELDS = [
  { label: 'Full Name', value: 'name', required: true },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Company', value: 'company' },
  { label: 'Deal Value', value: 'dealValue' },
  { label: 'Source', value: 'source' },
  { label: 'Notes', value: 'notes' },
];

export default function LeadsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'map'>('upload');
  const [importData, setImportData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Must filter by ownerUid to pass permissions check
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
      const matchesRep = repFilter === 'all' || lead.ownerUid === repFilter;
      return matchesSearch && matchesStatus && matchesRep;
    });
  }, [leads, search, statusFilter, repFilter]);

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    const newLead = {
      ownerUid: formData.get('assignTo') as string || user.uid,
      name,
      email,
      phone,
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

    try {
      addDocumentNonBlocking(collection(db, 'leads'), newLead).then((leadRef) => {
        if (phone || email) {
          addDocumentNonBlocking(collection(db, 'contacts'), {
            userId: user.uid,
            name,
            phone: phone || '',
            email: email || '',
            notes: `Auto-created from lead ${name}`,
            linkedLeadId: leadRef?.id || null,
            tags: ["Lead"],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          toast({ title: "Lead & Contact Saved", description: "Organizational directory synchronized." });
        } else {
          toast({ title: "Lead Added", description: `${name} assigned to the team.` });
        }
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not save record." });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportData(results.data);
        setImportHeaders(results.meta.fields || []);
        const initialMapping: Record<string, string> = {};
        results.meta.fields?.forEach(header => {
          const match = LEAD_FIELDS.find(f => f.value === header.toLowerCase() || f.label.toLowerCase() === header.toLowerCase());
          if (match) initialMapping[match.value] = header;
        });
        setColumnMapping(initialMapping);
        setImportStep('map');
      },
      error: (error) => {
        toast({ variant: "destructive", title: "Parsing Error", description: error.message });
      }
    });
  };

  const executeImport = async () => {
    if (!db || !user) return;
    setIsImporting(true);
    let successCount = 0;

    for (const row of importData) {
      const name = row[columnMapping['name']];
      if (!name) continue;

      const phone = row[columnMapping['phone']] || '';
      const email = row[columnMapping['email']] || '';

      const newLeadData = {
        ownerUid: user.uid,
        name,
        email,
        phone,
        company: row[columnMapping['company']] || '',
        status: 'new' as LeadStatus,
        dealValue: Number(row[columnMapping['dealValue']]) || 0,
        source: row[columnMapping['source']] || 'Imported',
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notesCount: 0,
        callsCount: 0,
        customFields: { importNotes: row[columnMapping['notes']] || '' }
      };

      addDocumentNonBlocking(collection(db, 'leads'), newLeadData).then((leadRef) => {
        if (phone || email) {
          addDocumentNonBlocking(collection(db, 'contacts'), {
            userId: user.uid,
            name,
            phone,
            email,
            notes: `Auto-created from import row`,
            linkedLeadId: leadRef?.id || null,
            tags: ["Imported"],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      successCount++;
    }

    setIsImporting(false);
    setIsImportModalOpen(false);
    setImportStep('upload');
    toast({ title: "Import Complete", description: `Successfully processed ${successCount} organizational records.` });
  };

  const handleAssignToRep = (repId: string) => {
    if (!db || selectedLeads.length === 0) return;
    selectedLeads.forEach(leadId => {
      updateDocumentNonBlocking(doc(db, 'leads', leadId), { ownerUid: repId, updatedAt: serverTimestamp() });
    });
    const repName = MOCK_TEAM.find(m => m.id === repId)?.name;
    toast({ title: "Leads Assigned", description: `${selectedLeads.length} leads assigned to ${repName}.` });
    setSelectedLeads([]);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Pipeline Records</h1>
          <p className="text-muted-foreground">Manage collective organizational prospect data.</p>
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
          
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 h-9" onClick={() => setIsImportModalOpen(true)}>
            <FileUp className="h-4 w-4 text-primary" /> Advanced Import
          </Button>

          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 h-9 font-bold text-xs uppercase tracking-widest">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-card/30 p-3 rounded-xl border border-border/50 sticky top-[72px] z-20 backdrop-blur-md border-2">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search team records..." 
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

      <Card className="bg-card/30 border-border/50 overflow-hidden shadow-2xl border-2 rounded-2xl">
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
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Prospect</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Stage</TableHead>
                <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-widest">Owner</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Valuation</TableHead>
                <TableHead className="hidden xl:table-cell font-black uppercase text-[10px] tracking-widest">Origin</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium">Syncing Team Pipeline...</span>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/10 group cursor-pointer" onClick={() => window.location.href = `/dashboard/leads/${lead.id}`}>
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
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Record Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.location.href = `/dashboard/leads/${lead.id}`}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Adjust Valuation</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-500">Archive Record</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                    No records matching current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Advanced Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col rounded-3xl border-2 p-0">
          <DialogHeader className="p-8 bg-primary/5 border-b border-border/50">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <FileUp className="h-6 w-6 text-primary" /> Advanced Data Ingestion
            </DialogTitle>
            <DialogDescription>Import organizational leads from CSV, Excel, or JSON formats.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8">
            {importStep === 'upload' ? (
              <div className="space-y-8 flex flex-col items-center justify-center py-12">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md border-4 border-dashed border-border/50 rounded-3xl p-12 text-center hover:border-primary/30 transition-all cursor-pointer bg-muted/10 group"
                >
                  <FileUp className="h-16 w-16 mx-auto mb-6 text-primary opacity-40 group-hover:scale-110 transition-transform" />
                  <p className="text-lg font-black">Upload Data File</p>
                  <p className="text-sm text-muted-foreground mt-2">Supports .csv, .xlsx, .json, and .txt formats.</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls,.json,.txt" onChange={handleFileSelect} />
                </div>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                   <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Auto-header detection</span>
                   <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Smart Directory Sync</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-emerald-500/5 border-2 border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-black">File Parsed Successfully</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{importData.length} organizational rows detected.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-primary" /> Define Field Mappings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {LEAD_FIELDS.map(field => (
                      <div key={field.value} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <Select 
                          value={columnMapping[field.value] || ''} 
                          onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field.value]: val }))}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder={`Map to ${field.label}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">-- Skip Field --</SelectItem>
                            {importHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                   <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Data Preview (First 3 Rows)
                  </h3>
                  <div className="border-2 rounded-xl overflow-hidden bg-card/50">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          {importHeaders.slice(0, 4).map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importData.slice(0, 3).map((row, i) => (
                          <TableRow key={i}>
                            {importHeaders.slice(0, 4).map(h => <TableCell key={h} className="text-xs py-2">{row[h]}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 border-t border-border/50 bg-muted/20">
            {importStep === 'map' && (
              <Button variant="ghost" onClick={() => setImportStep('upload')} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">Back</Button>
            )}
            <Button 
              disabled={importStep === 'upload' || isImporting || !columnMapping['name']}
              onClick={executeImport}
              className="flex-1 h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px] rounded-xl gap-2"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isImporting ? 'Ingesting Data...' : 'Confirm and Import Leads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-xl border-border/50 rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Create New Pipeline Record</DialogTitle>
            <DialogDescription>A directory contact will be auto-synchronized if phone/email is provided.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest">Full Name</Label>
                <Input id="name" name="name" placeholder="Lead Name" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest">Company</Label>
                <Input id="company" name="company" placeholder="Acme Inc" className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="email@example.com" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+1234567890" className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealValue" className="text-[10px] font-black uppercase tracking-widest">Deal Value ($)</Label>
                <Input id="dealValue" name="dealValue" type="number" placeholder="5000" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignTo" className="text-[10px] font-black uppercase tracking-widest">Lead Owner</Label>
                <Select name="assignTo" defaultValue={user?.uid || 'user1'}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Rep" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full shadow-lg shadow-primary/20 font-black uppercase tracking-widest h-12 rounded-xl">Publish Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}