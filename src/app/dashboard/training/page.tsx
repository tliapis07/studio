'use client';

import { useState, useCallback } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Folder, 
  FileText, 
  Trash2, 
  Upload,
  Link as LinkIcon,
  Settings2,
  FileIcon,
  X,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TrainingMaterial } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

export default function TrainingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);
  const [editingMaterial, setEditingNote] = useState<TrainingMaterial | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [subjects, setSubjects] = useState(["Cold Calling", "Closing Techniques", "Product Knowledge", "Objection Handling", "CRM Training"]);

  const trainingQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Must filter by userId to pass permissions check on root collection
    return query(collection(db, 'training_materials'), where('userId', '==', user.uid));
  }, [db, user]);

  const { data: materials, isLoading } = useCollection<TrainingMaterial>(trainingQuery);

  const filteredMaterials = (materials || []).filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          (m.content && m.content.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
          toast({ title: "Ready to Publish", description: `${file.name} prepared for library.` });
        }
      }, 300);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;

    const baseMaterial = {
      userId: user.uid,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      updatedAt: serverTimestamp(),
    };

    if (editingMaterial) {
      await updateDoc(doc(db, 'training_materials', editingMaterial.id), {
        ...baseMaterial,
        title: formData.get('title') as string,
      });
      toast({ title: "Material Updated", description: "Changes saved to library." });
    } else {
      if (type === 'pdf' && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await addDoc(collection(db, 'training_materials'), {
            ...baseMaterial,
            title: file.name,
            type: 'pdf',
            fileUrl: `mock-storage-url/${file.name}`,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        await addDoc(collection(db, 'training_materials'), {
          ...baseMaterial,
          title: formData.get('title') as string,
          type: 'link',
          fileUrl: formData.get('url') as string || '',
          createdAt: serverTimestamp(),
        });
      }
      toast({ title: "Resources Added", description: "Material published to organizational library." });
    }

    setIsAddOpen(false);
    setEditingNote(null);
    setUploadedFiles([]);
    setUploadProgress({});
  };

  const handleAddSubject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (name) {
      if (editingSubject) {
        setSubjects(prev => prev.map(s => s === editingSubject ? name : s));
        toast({ title: "Subject Updated", description: `Renamed to '${name}'.` });
      } else {
        setSubjects(prev => [...prev, name]);
        toast({ title: "Subject Created", description: `Added '${name}' to categories.` });
      }
      setIsNewSubjectOpen(false);
      setEditingSubject(null);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'training_materials', id));
    toast({ title: "Resource Removed", description: "Deleted from library." });
  };

  const handleDeleteSubject = (subjectName: string) => {
    setSubjects(prev => prev.filter(s => s !== subjectName));
    toast({ title: "Subject Deleted", description: `'${subjectName}' removed from categories.` });
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-foreground">Training Hub</h1>
          <p className="text-muted-foreground font-medium">Organizational resources for top-tier performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2">
            <Settings2 className="h-6 w-6" />
          </Button>
          <Button onClick={() => { setEditingNote(null); setIsAddOpen(true); }} className="bg-primary shadow-xl shadow-primary/20 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3">
            <Upload className="h-6 w-6" /> Upload Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="bg-card/50 border-2 border-border/50 rounded-3xl h-fit overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              <Folder className="h-4 w-4 text-primary" /> Subject Index
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <button onClick={() => setSelectedSubject('all')} className={`flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-l-4 ${selectedSubject === 'all' ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}>
                <BookOpen className="h-4 w-4" /> All Materials
              </button>
              {subjects.map(s => (
                <div key={s} className="group relative flex items-center">
                  <button onClick={() => setSelectedSubject(s)} className={`flex-1 flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-l-4 ${selectedSubject === s ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}>
                    <Folder className="h-4 w-4" /> {s}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-2 opacity-0 group-hover:opacity-100 h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSubject(s); setIsNewSubjectOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-500" onClick={() => handleDeleteSubject(s)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button variant="ghost" className="m-4 text-[10px] font-black uppercase tracking-widest h-10 border-2 border-dashed border-border/50 rounded-xl" onClick={() => { setEditingSubject(null); setIsNewSubjectOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Subject
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-card/30 p-3 rounded-2xl border-2 border-border/50 backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search organizational library..." className="pl-12 h-12 bg-background/50 rounded-xl border-2 border-transparent focus:border-primary/30" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted/20 animate-pulse border-2" />)}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredMaterials.map((m) => (
                <Card key={m.id} className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/40 transition-all shadow-lg flex flex-col group">
                  <CardHeader className="p-6 bg-primary/5 border-b-2 border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border-primary/10">{m.subject}</Badge>
                        <CardTitle className="text-base font-black flex items-center gap-2 group-hover:text-primary transition-colors">
                           {m.type === 'pdf' ? <FileText className="h-4 w-4 text-rose-500" /> : <LinkIcon className="h-4 w-4 text-blue-500" />}
                           {m.title}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingNote(m); setIsAddOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-500" onClick={() => handleDeleteMaterial(m.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">{m.content}</p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 mt-auto">
                    <Button variant="outline" className="w-full gap-2 rounded-xl h-10 font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                      Access Resource
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
              <GraduationCap className="h-20 w-20 text-muted-foreground/20 mb-6" />
              <h3 className="text-xl font-black text-muted-foreground">Library Empty</h3>
              <p className="text-muted-foreground text-sm font-medium">Populate subjects and materials for your team.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingMaterial ? 'Edit' : 'Publish'} Training Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMaterial} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Subject Area</Label>
                <Select name="subject" defaultValue={editingMaterial?.subject} required>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl">
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resource Type</Label>
                <Select name="type" defaultValue={editingMaterial?.type || "pdf"}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl">
                    <SelectItem value="pdf">File Upload (PDF/Doc/Img)</SelectItem>
                    <SelectItem value="link">External Link / URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
               <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</Label>
               <Input name="title" defaultValue={editingMaterial?.title} required className="h-12 rounded-xl border-2" />
            </div>

            <div className="space-y-2">
               <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
               <Textarea name="content" defaultValue={editingMaterial?.content} placeholder="Briefly explain what this resource covers..." required className="h-24 rounded-xl border-2" />
            </div>

            {!editingMaterial && (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${isDragActive ? 'bg-primary/10 border-primary' : 'bg-muted/10 border-border/50 hover:bg-muted/20'}`}>
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-4 text-primary opacity-60" />
                {isDragActive ? (
                  <p className="text-sm font-black text-primary">Drop files to prepare upload...</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-black">Drag files here or click to select</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">PDF, Word, or Images up to 20MB</p>
                  </div>
                )}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border-2 border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Pending Uploads ({uploadedFiles.length})</p>
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileIcon className="h-3 w-3 text-primary" />
                        <span className="font-bold truncate">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Progress value={uploadProgress[file.name] || 0} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest rounded-xl">
                {editingMaterial ? 'Update' : 'Publish'} Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewSubjectOpen} onOpenChange={setIsNewSubjectOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingSubject ? 'Rename' : 'Create New'} Subject Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Subject Name</Label>
              <Input name="name" defaultValue={editingSubject || ''} required placeholder="e.g. Advanced Negotiation" className="h-12 rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-11 font-black uppercase tracking-widest rounded-xl">Save Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
