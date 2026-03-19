
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, StickyNote, Trash2, Edit2, Tag, Filter, Settings2 } from 'lucide-react';
import { UserNote } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const NOTE_TAGS = ["Ideas", "Scripts", "Objections", "Strategy", "Client Feedback"];

export default function NotesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  const notesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: notes, isLoading } = useCollection<UserNote>(notesQuery);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    return notes.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                            n.content.toLowerCase().includes(search.toLowerCase());
      const matchesTag = selectedTag === 'all' || n.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [notes, search, selectedTag]);

  const handleSaveNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;

    const formData = new FormData(e.currentTarget);
    const selectedTags = Array.from(formData.getAll('tags')) as string[];
    const noteData = {
      userId: user.uid,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: selectedTags,
      updatedAt: serverTimestamp(),
    };

    if (editingNote) {
      updateDocumentNonBlocking(doc(db, 'notes', editingNote.id), noteData);
      toast({ title: "Note Updated", description: "Changes saved to library." });
    } else {
      addDocumentNonBlocking(collection(db, 'notes'), {
        ...noteData,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Note Created", description: "New resource added to SalesStream." });
    }
    setIsAddOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'notes', id));
    toast({ title: "Note Deleted", description: "Removed from library." });
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-foreground">Sales Notes</h1>
          <p className="text-muted-foreground font-medium">Capture scripts, handling techniques, and strategy ideas.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2">
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button onClick={() => { setEditingNote(null); setIsAddOpen(true); }} className="bg-primary shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3">
            <Plus className="h-5 w-5" /> New Note
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search notes..." 
            className="pl-12 h-12 bg-card/50 rounded-xl border-2 border-border/50 focus:border-primary/30" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button 
            variant={selectedTag === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTag('all')}
            className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px]"
          >
            All
          </Button>
          {NOTE_TAGS.map(tag => (
            <Button 
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedTag(tag)}
              className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] whitespace-nowrap"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-64 rounded-3xl animate-pulse bg-muted/20 border-2" />)}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/40 transition-all group flex flex-col shadow-lg">
              <CardHeader className="p-6 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border-primary/10">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingNote(note); setIsAddOpen(true); }} className="h-8 w-8 text-primary"><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)} className="h-8 w-8 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-black">{note.title}</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest mt-1">
                  Updated {note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleDateString() : 'Recently'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
          <StickyNote className="h-20 w-20 text-muted-foreground/20 mb-6" />
          <h3 className="text-xl font-black">No Notes Found</h3>
          <p className="text-muted-foreground text-sm font-medium">Capture your first sales insight or script idea.</p>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNote} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input name="title" defaultValue={editingNote?.title} placeholder="e.g. Closing Script: High Value Leads" required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Content</Label>
              <Textarea 
                name="content" 
                defaultValue={editingNote?.content} 
                placeholder="Write your note here..." 
                required 
                className="min-h-[200px] rounded-xl leading-relaxed" 
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {NOTE_TAGS.map(tag => (
                  <label key={tag} className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border-2 border-transparent cursor-pointer hover:bg-primary/10 transition-colors has-[:checked]:bg-primary/20 has-[:checked]:border-primary/30">
                    <input 
                      type="checkbox" 
                      name="tags" 
                      value={tag} 
                      defaultChecked={editingNote?.tags.includes(tag)}
                      className="hidden" 
                    />
                    <Tag className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest">
                {editingNote ? 'Update Note' : 'Save Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
