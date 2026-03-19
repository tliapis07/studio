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
import { 
  MoreVertical, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle,
  Trash2,
  Edit2,
  Contact as ContactIcon
} from 'lucide-react';
import { Contact } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function ContactsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'contacts'));
  }, [db, user]);

  const { data: contacts, isLoading } = useCollection<Contact>(contactsQuery);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(search.toLowerCase()) || 
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone.includes(search)
    );
  }, [contacts, search]);

  const handleSaveContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const contactData = {
      userId: user.uid,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      secondaryPhone: formData.get('secondaryPhone') as string,
      notes: formData.get('notes') as string,
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

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Client Contacts</h1>
          <p className="text-muted-foreground">Unified directory for all organizational client phone numbers.</p>
        </div>
        <Button onClick={() => { setEditingContact(null); setIsAddModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20 h-10">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search contacts..." 
          className="pl-10 bg-background/50 h-11 rounded-xl" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="bg-card/30 border-border/50 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden xl:table-cell">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Syncing directory...</TableCell>
              </TableRow>
            ) : filteredContacts.length > 0 ? filteredContacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-muted/10 group">
                <TableCell className="font-bold">{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell className="text-sm">{contact.email || '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground italic truncate max-w-xs">{contact.notes || 'No notes'}</TableCell>
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
                          <Edit2 className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-rose-500">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No contacts found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>Store phone numbers and emails for easy team access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveContact} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={editingContact?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingContact?.phone} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <Input id="secondaryPhone" name="secondaryPhone" defaultValue={editingContact?.secondaryPhone} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" defaultValue={editingContact?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Input id="notes" name="notes" defaultValue={editingContact?.notes} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-11">{editingContact ? 'Update Contact' : 'Save Contact'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
