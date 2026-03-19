'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, StickyNote, Trash2, Edit2, Tag, Filter, Settings2, Sparkles, Loader2, X } from 'lucide-react';
import { UserNote } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { summarizeNote } from '@/ai/flows/summarize-note';

const DEFAULT_TAGS = ["Ideas", "Scripts", "Objections", "Strategy", "Client Feedback"];

export default function NotesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  
  // Custom Tag States
  const [newTagInput, setNewTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);

  const notesQueryStable = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Must filter by ownerUid to pass permissions check
    return query(collection(db, 'notes'), where('ownerUid', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: notes, isLoading } = useCollection<UserNote>(notesQueryStable);

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
      ownerUid: user.uid,
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

  const handleSummarize = async () => {
    if (!editingNote || !editingNote.content) return;
    
    setIsSummarizing(true);
    try {
      const summary = await summarizeNote({ 
        title: editingNote.title, 
        content: editingNote.content 
      });
      toast({ 
        title: "AI Summary Generated", 
        description: summary,
        className: "bg-primary text-white font-medium"
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "AI Error", 
        description: "Could not generate summary." 
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const addNewTag = () => {
    if (!newTagInput.trim()) return;
    if (availableTags.includes(newTagInput)) {
      toast({ title: "Duplicate Tag", description: "This tag already exists." });
      return;
    }
    setAvailableTags(prev => [...prev, newTagInput.trim()]);
    setNewTagInput('');
    toast({ title: "Tag Added", description: `'${newTagInput}' is now available for your notes.` });
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
          {availableTags.map(tag => (
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

      {/* Professional Note Editor Workspace */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] rounded-3xl border-2 flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-8 pb-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {editingNote ? <Edit2 className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                  {editingNote ? 'Note Workspace' : 'Create New Note'}
                </DialogTitle>
                <DialogDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  Sales Stream Editorial Suite
                </DialogDescription>
              </div>
              {editingNote && (
                <Button 
                  onClick={handleSummarize} 
                  disabled={isSummarizing || !editingNote.content}
                  className="bg-primary shadow-lg shadow-primary/20 h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                >
                  {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Summarize
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveNote} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Title</Label>
                <Input 
                  name="title" 
                  defaultValue={editingNote?.title} 
                  placeholder="e.g. Closing Script: High Value Leads" 
                  required 
                  className="h-14 rounded-xl text-lg font-bold bg-background border-2 border-border/50 focus:border-primary/50 transition-all" 
                />
              </div>

              <div className="space-y-3 flex-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editor Content</Label>
                <Textarea 
                  name="content" 
                  defaultValue={editingNote?.content} 
                  placeholder="Draft your strategy, scripts, or objections here..." 
                  required 
                  className="min-h-[400px] rounded-xl leading-relaxed bg-background border-2 border-border/50 focus:border-primary/50 text-base resize-none p-6" 
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organizational Tags</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add custom tag..." 
                      className="h-8 w-40 text-[10px] rounded-lg"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                    />
                    <Button type="button" size="icon" className="h-8 w-8 rounded-lg" onClick={addNewTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/10 rounded-2xl border-2 border-border/30 shadow-inner">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border-2 border-border/50 cursor-pointer hover:bg-primary/5 transition-all has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50 group">
                      <input 
                        type="checkbox" 
                        name="tags" 
                        value={tag} 
                        defaultChecked={editingNote?.tags.includes(tag)}
                        className="hidden" 
                      />
                      <Tag className="h-3 w-3 text-muted-foreground group-has-[:checked]:text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 border-t border-border/50 bg-muted/20">
              <Button type="submit" className="w-full h-14 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-sm rounded-2xl">
                {editingNote ? 'Commit Changes' : 'Publish Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}