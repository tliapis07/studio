'use client';

import { useState, useMemo } from 'react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle,
  Trash2,
  Edit2,
  Contact as ContactIcon,
  Tag,
  X
} from 'lucide-react';
import { Contact } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const DEFAULT_TAGS = ["Client", "Lead", "Referral", "VIP", "Partner"];

export default function ContactsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTagModalOpen, setIsTypeManageOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [newTagInput, setNewTagInput] = useState('');

  const contactsQueryStable = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Root collection read requires filtering by userId/ownerUid
    return query(collection(db, 'contacts'), where('userId', '==', user.uid));
  }, [db, user]);

  const { data: contacts, isLoading } = useCollection<Contact>(contactsQueryStable);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(search.toLowerCase()) || 
                            contact.email?.toLowerCase().includes(search.toLowerCase()) ||
                            contact.phone.includes(search);
      const matchesTag = selectedTagFilter === 'all' || (contact.tags && contact.tags.includes(selectedTagFilter));
      return matchesSearch && matchesTag;
    });
  }, [contacts, search, selectedTagFilter]);

  const handleSaveContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const selectedTags = Array.from(formData.getAll('tags')) as string[];
    const contactData = {
      userId: user.uid,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      secondaryPhone: formData.get('secondaryPhone') as string,
      notes: formData.get('notes') as string,
      tags: selectedTags,
      updatedAt: serverTimestamp(),
    };

    if (editingContact) {
      updateDocumentNonBlocking(doc(db, 'contacts', editingContact.id), contactData);
      toast({ title: "Contact Updated", description: "Changes saved successfully." });
    } else {
      addDocumentNonBlocking(collection(db, 'contacts'), {
        ...contactData,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Contact Added", description: "New contact saved to directory." });
    }
    setIsAddModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'contacts', id));
    toast({ title: "Contact Deleted", description: "Record removed from directory." });
  };

  const addNewTag = () => {
    if (!newTagInput.trim()) return;
    setAvailableTags(prev => [...prev, newTagInput.trim()]);
    setNewTagInput('');
    toast({ title: "Tag Created", description: `'${newTagInput}' added to directory labels.` });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Directory</h1>
          <p className="text-muted-foreground">Unified management for organizational client phone numbers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTypeManageOpen(true)} className="border-2 gap-2 h-10 font-bold text-xs uppercase tracking-widest">
            <Tag className="h-4 w-4" /> Manage Labels
          </Button>
          <Button onClick={() => { setEditingContact(null); setIsAddModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 h-10 font-bold text-xs uppercase tracking-widest">
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search directory..." 
            className="pl-10 bg-card/50 h-11 rounded-xl border-2" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
          <Button 
            variant={selectedTagFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTagFilter('all')}
            className="rounded-xl h-9 px-4 font-black uppercase tracking-widest text-[9px]"
          >
            All
          </Button>
          {availableTags.map(tag => (
            <Button 
              key={tag}
              variant={selectedTagFilter === tag ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedTagFilter(tag)}
              className="rounded-xl h-9 px-4 font-black uppercase tracking-widest text-[9px] whitespace-nowrap"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-card/30 border-border/50 overflow-hidden shadow-2xl rounded-2xl border-2">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Name</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Phone</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Email</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Labels</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Syncing directory records...</TableCell>
              </TableRow>
            ) : filteredContacts.length > 0 ? filteredContacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-muted/10 group">
                <TableCell className="font-bold">{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell className="text-sm">{contact.email || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map(t => (
                      <Badge key={t} variant="secondary" className="bg-primary/10 text-primary text-[8px] uppercase font-black px-1.5 py-0 rounded-lg">{t}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openWhatsApp(contact.phone)} className="text-emerald-500 hover:bg-emerald-500/10">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingContact(contact); setIsAddModalOpen(true); }}>
                          <Edit2 className="h-4 w-4 mr-2" /> Edit Record
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-rose-500">
                          <Trash2 className="h-4 w-4 mr-2" /> Archive Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No matching records found in directory.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Directory Record' : 'Add New Client Contact'}</DialogTitle>
            <DialogDescription>Store phone numbers and labels for easy team access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveContact} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest">Full Name</Label>
              <Input id="name" name="name" defaultValue={editingContact?.name} required className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest">Primary Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingContact?.phone} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone" className="text-[10px] font-black uppercase tracking-widest">Secondary Phone</Label>
                <Input id="secondaryPhone" name="secondaryPhone" defaultValue={editingContact?.secondaryPhone} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest">Email Address</Label>
              <Input id="email" name="email" type="email" defaultValue={editingContact?.email} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Organizational Labels</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-xl border-2 shadow-inner">
                {availableTags.map(tag => (
                  <label key={tag} className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border-2 border-border/50 cursor-pointer hover:bg-primary/5 transition-all has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50 group">
                    <input 
                      type="checkbox" 
                      name="tags" 
                      value={tag} 
                      defaultChecked={editingContact?.tags?.includes(tag)}
                      className="hidden" 
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest">Internal Notes</Label>
              <Input id="notes" name="notes" defaultValue={editingContact?.notes} className="h-12 rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest rounded-xl">{editingContact ? 'Update Record' : 'Save to Directory'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTagModalOpen} onOpenChange={setIsTypeManageOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Manage Label Directory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input 
                placeholder="New Label Name..." 
                className="h-11 rounded-xl"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
              />
              <Button onClick={addNewTag} size="icon" className="h-11 w-11 rounded-xl"><Plus className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-2">
              {availableTags.map(tag => (
                <div key={tag} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 group">
                  <span className="text-xs font-bold uppercase tracking-widest">{tag}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100" onClick={() => setAvailableTags(prev => prev.filter(t => t !== tag))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}