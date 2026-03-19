
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Folder, 
  FileText, 
  Trash2, 
  MoreVertical,
  Filter,
  Link as LinkIcon,
  FileCode,
  Upload
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TrainingMaterial } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function TrainingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);

  // Mock subjects for now - in real app would pull from 'training_subjects'
  const [subjects, setSubjects] = useState(["Cold Calling", "Closing Techniques", "Product Knowledge", "Objection Handling", "CRM Training"]);

  const trainingQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'training_materials'));
  }, [db, user]);

  const { data: materials, isLoading } = useCollection<TrainingMaterial>(trainingQuery);

  const filteredMaterials = (materials || []).filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.content.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    const formData = new FormData(e.currentTarget);
    const newMaterial = {
      userId: user.uid,
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as string,
      fileUrl: formData.get('url') as string || '',
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'training_materials'), newMaterial);
    setIsAddOpen(false);
    toast({ title: "Resource Added", description: "Material published to library." });
  };

  const handleAddSubject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (name) {
      setSubjects(prev => [...prev, name]);
      setIsNewSubjectOpen(false);
      toast({ title: "Subject Created", description: `Added '${name}' to categories.` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'training_materials', id));
    toast({ title: "Resource Removed", description: "Deleted from library." });
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Training Hub</h1>
          <p className="text-muted-foreground font-medium">Organizational resources for top-tier performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsNewSubjectOpen(true)} className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-xs gap-3">
            <Plus className="h-5 w-5" /> New Subject
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-primary shadow-xl shadow-primary/20 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3">
            <Upload className="h-6 w-6" /> Upload Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="bg-card/50 border-2 border-border/50 rounded-3xl h-fit">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Folder className="h-5 w-5 text-primary" /> Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <button onClick={() => setSelectedSubject('all')} className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${selectedSubject === 'all' ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}>
                <BookOpen className="h-4 w-4" /> All Materials
              </button>
              {subjects.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)} className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${selectedSubject === s ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}>
                  <Folder className="h-4 w-4" /> {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-card/30 p-3 rounded-2xl border-2 border-border/50 backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search materials..." className="pl-12 h-12 bg-background/50 rounded-xl border-2 border-transparent focus:border-primary/30" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted/20 animate-pulse border-2" />)}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredMaterials.map((m) => (
                <Card key={m.id} className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/40 transition-all shadow-lg flex flex-col">
                  <CardHeader className="p-6 bg-primary/5 border-b-2 border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-lg">{m.subject}</Badge>
                        <CardTitle className="text-lg font-black mt-2 flex items-center gap-2">
                           {m.type === 'pdf' ? <FileText className="h-4 w-4 text-rose-500" /> : <LinkIcon className="h-4 w-4 text-blue-500" />}
                           {m.title}
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{m.content}</p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 mt-auto">
                    <Button variant="outline" className="w-full gap-2 rounded-xl h-10 font-bold uppercase text-[10px] tracking-widest border-2">
                      View Material
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
              <GraduationCap className="h-20 w-20 text-muted-foreground/20 mb-6" />
              <h3 className="text-xl font-black">Library Empty</h3>
              <p className="text-muted-foreground text-sm font-medium">Add subjects and upload training resources to begin.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Training Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMaterial} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" required />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select name="subject" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="type" defaultValue="link">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF / Document</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                  <SelectItem value="video">Video URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL / Path</Label>
              <Input name="url" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="content" required />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12">Publish to Library</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewSubjectOpen} onOpenChange={setIsNewSubjectOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input name="name" required placeholder="e.g. Sales Psychology" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Create Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
