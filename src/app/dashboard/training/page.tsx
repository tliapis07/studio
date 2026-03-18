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
  CheckCircle2
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

const SUBJECTS = ["Cold Calling", "Closing Techniques", "Product Knowledge", "Objection Handling", "CRM Training"];

export default function TrainingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

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
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'training_materials'), newMaterial);
      setIsAddOpen(false);
      toast({ title: "Resource Added", description: "The training material has been successfully published." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add resource." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'training_materials', id));
      toast({ title: "Resource Removed", description: "Training material has been deleted." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete resource." });
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Training Materials</h1>
          <p className="text-muted-foreground font-medium">Equip your team with the knowledge to close more deals.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary shadow-xl shadow-primary/20 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3">
              <Plus className="h-6 w-6" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-2 border-border/50 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Create Training Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMaterial} className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</label>
                <Input name="title" placeholder="e.g. Advanced Closing Techniques" className="h-12 rounded-xl bg-background/50 border-2" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                <select name="subject" className="w-full h-12 rounded-xl bg-background/50 border-2 border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" required>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Content / Instructions</label>
                <Textarea name="content" placeholder="Enter the training details here..." className="min-h-[200px] rounded-xl bg-background/50 border-2" required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20">Publish Resource</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="bg-card/50 border-2 border-border/50 rounded-3xl h-fit">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Folder className="h-5 w-5 text-primary" /> Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <button 
                onClick={() => setSelectedSubject('all')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${selectedSubject === 'all' ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}
              >
                <BookOpen className="h-4 w-4" /> All Materials
              </button>
              {SUBJECTS.map(subject => (
                <button 
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${selectedSubject === subject ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}
                >
                  <FileText className="h-4 w-4" /> {subject}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/30 p-3 rounded-2xl border-2 border-border/50 backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search training materials..." 
                className="pl-12 h-12 bg-background/50 rounded-xl border-2 border-transparent focus:border-primary/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl border-2 hover:bg-muted/50">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted/20 animate-pulse border-2" />)}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/40 transition-all shadow-lg hover:shadow-2xl group flex flex-col">
                  <CardHeader className="p-6 bg-primary/5 border-b-2 border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border-primary/20">{material.subject}</Badge>
                        <CardTitle className="text-lg font-black leading-tight mt-2">{material.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-2 shadow-xl">
                          <DropdownMenuItem className="gap-2 font-bold cursor-pointer"><FileText className="h-4 w-4" /> Edit Content</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 font-bold cursor-pointer text-rose-500" onClick={() => handleDelete(material.id)}><Trash2 className="h-4 w-4" /> Delete Material</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed font-medium italic">
                      {material.content}
                    </p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 flex justify-between items-center mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {material.createdAt?.toDate ? material.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                    <Button variant="ghost" size="sm" className="gap-2 font-black uppercase text-[10px] tracking-widest text-primary hover:bg-primary/10 rounded-lg h-8">
                      View Resource
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
              <GraduationCap className="h-20 w-20 text-muted-foreground/20 mb-6" />
              <h3 className="text-xl font-black mb-2">No Training Resources</h3>
              <p className="text-muted-foreground text-sm max-w-xs text-center font-medium">Equip your sales team by adding the first training material.</p>
              <Button variant="outline" className="mt-8 rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs border-2" onClick={() => setIsAddOpen(true)}>Create Resource</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
