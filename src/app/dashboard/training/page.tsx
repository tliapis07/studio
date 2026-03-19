'use client';

import { useState, useCallback } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Edit2,
  Check,
  Eye
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
import { TrainingMaterial, Tag } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

export default function TrainingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<TrainingMaterial | null>(null);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [editingSubject, setEditingSubject] = useState<Tag | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const trainingQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'training_materials'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const subjectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'tags'), where('ownerUid', '==', user.uid), where('type', '==', 'training'));
  }, [db, user]);

  const { data: materials, isLoading } = useCollection<TrainingMaterial>(trainingQuery);
  const { data: subjects } = useCollection<Tag>(subjectsQuery);

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
        progress += 25;
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        if (progress >= 100) clearInterval(interval);
      }, 200);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;

    const baseMaterial = {
      ownerUid: user.uid,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      updatedAt: serverTimestamp(),
    };

    if (editingMaterial) {
      updateDocumentNonBlocking(doc(db, 'training_materials', editingMaterial.id), { ...baseMaterial, title: formData.get('title') as string });
      toast({ title: "Material Updated", description: "Changes saved." });
    } else {
      if (type === 'pdf' && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          addDocumentNonBlocking(collection(db, 'training_materials'), { ...baseMaterial, title: file.name, type: 'pdf', fileUrl: 'https://example.com/mock.pdf', createdAt: serverTimestamp() });
        }
      } else {
        addDocumentNonBlocking(collection(db, 'training_materials'), { ...baseMaterial, title: formData.get('title') as string, type: 'link', fileUrl: formData.get('url') as string || '', createdAt: serverTimestamp() });
      }
      toast({ title: "Resources Published", description: "Added to organizational library." });
    }
    setIsAddOpen(false);
    setEditingMaterial(null);
    setUploadedFiles([]);
  };

  const handleSaveSubject = () => {
    if (!db || !user || !newSubjectInput.trim()) return;
    if (editingSubject) {
      updateDocumentNonBlocking(doc(db, 'tags', editingSubject.id), { name: newSubjectInput.trim(), updatedAt: serverTimestamp() });
      setEditingSubject(null);
    } else {
      addDocumentNonBlocking(collection(db, 'tags'), { ownerUid: user.uid, name: newSubjectInput.trim(), type: 'training', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setNewSubjectInput('');
    setIsNewSubjectOpen(false);
  };

  const handleDeleteSubject = (tag: Tag) => {
    const isUsed = materials?.some(m => m.subject === tag.name);
    if (isUsed) {
      toast({ variant: "destructive", title: "Cannot Delete", description: "This subject has active materials." });
      return;
    }
    deleteDocumentNonBlocking(doc(db, 'tags', tag.id));
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-foreground">Training Hub</h1>
          <p className="text-muted-foreground font-medium">Organizational resources for top-tier performance.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setEditingMaterial(null); setIsAddOpen(true); }} className="bg-primary shadow-xl h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3"><Plus className="h-6 w-6" /> Publish Resource</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="bg-card/50 border-2 border-border/50 rounded-3xl h-fit overflow-hidden">
          <CardHeader className="p-6 pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-3"><Folder className="h-4 w-4 text-primary" /> Subject Index</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <button onClick={() => setSelectedSubject('all')} className={`flex items-center gap-3 px-6 py-4 text-xs font-black uppercase transition-all border-l-4 ${selectedSubject === 'all' ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}><BookOpen className="h-4 w-4" /> All Materials</button>
              {subjects?.map(s => (
                <div key={s.id} className="group relative flex items-center">
                  <button onClick={() => setSelectedSubject(s.name)} className={`flex-1 flex items-center gap-3 px-6 py-4 text-xs font-black uppercase transition-all border-l-4 ${selectedSubject === s.name ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}><Folder className="h-4 w-4" /> {s.name}</button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="absolute right-2 opacity-0 group-hover:opacity-100 h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSubject(s); setNewSubjectInput(s.name); setIsNewSubjectOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-500" onClick={() => handleDeleteSubject(s)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button variant="ghost" className="m-4 text-[10px] font-black uppercase h-10 border-2 border-dashed rounded-xl" onClick={() => { setEditingSubject(null); setNewSubjectInput(''); setIsNewSubjectOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search organizational library..." className="pl-12 h-12 bg-card/30 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted/20 animate-pulse border-2" />)}</div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredMaterials.map((m) => (
                <Card key={m.id} className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/40 transition-all flex flex-col group">
                  <CardHeader className="p-6 bg-primary/5 border-b-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] uppercase font-black px-2 py-0.5 rounded-lg">{m.subject}</Badge>
                        <CardTitle className="text-base font-black flex items-center gap-2 group-hover:text-primary transition-colors">{m.type === 'pdf' ? <FileText className="h-4 w-4 text-rose-500" /> : <LinkIcon className="h-4 w-4 text-blue-500" />} {m.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingMaterial(m); setIsAddOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'training_materials', m.id))}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1"><p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">{m.content}</p></CardContent>
                  <CardFooter className="p-6 pt-0 mt-auto">
                    <Button variant="outline" className="w-full gap-2 rounded-xl h-10 font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary" onClick={() => setViewingMaterial(m)}>Access Resource</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed"><GraduationCap className="h-20 w-20 opacity-20 mb-6" /><h3 className="text-xl font-black">Library Empty</h3></div>
          )}
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editingMaterial ? 'Edit' : 'Publish'} Training Resource</DialogTitle></DialogHeader>
          <form onSubmit={handleAddMaterial} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase">Subject Area</Label>
                <Select name="subject" defaultValue={editingMaterial?.subject} required>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-2">{subjects?.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase">Resource Type</Label>
                <Select name="type" defaultValue={editingMaterial?.type || "pdf"}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="pdf">File Upload</SelectItem><SelectItem value="link">External Link</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-xs font-black uppercase">Title</Label><Input name="title" defaultValue={editingMaterial?.title} required className="h-12 rounded-xl border-2" /></div>
            <div className="space-y-2"><Label className="text-xs font-black uppercase">Description</Label><Textarea name="content" defaultValue={editingMaterial?.content} required className="h-24 rounded-xl border-2" /></div>
            {!editingMaterial && (<div {...getRootProps()} className="border-2 border-dashed rounded-2xl p-8 text-center bg-muted/10"><input {...getInputProps()} /><Upload className="h-10 w-10 mx-auto mb-4 opacity-60" /><p className="text-sm font-black">Drag files or click to select</p></div>)}
            <DialogFooter><Button type="submit" className="w-full h-12 shadow-xl font-black uppercase rounded-xl">Save Material</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingMaterial} onOpenChange={() => setViewingMaterial(null)}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] rounded-3xl flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-8 border-b bg-muted/20">
            <DialogTitle className="flex items-center gap-3"><Eye className="h-6 w-6 text-primary" /> {viewingMaterial?.title}</DialogTitle>
            <DialogDescription className="font-bold text-primary uppercase text-[10px]">{viewingMaterial?.subject}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{viewingMaterial?.content}</p>
            {viewingMaterial?.fileUrl && (
              <div className="mt-8 p-6 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-4"><FileText className="h-10 w-10 text-primary" /><div><p className="font-black text-sm">Attached Resource</p><p className="text-[10px] uppercase font-bold text-muted-foreground">{viewingMaterial.type}</p></div></div>
                <Button className="font-black uppercase tracking-widest text-[10px] rounded-xl" onClick={() => window.open(viewingMaterial.fileUrl, '_blank')}>View Attachment</Button>
              </div>
            )}
          </div>
          <DialogFooter className="p-8 border-t bg-muted/20"><Button onClick={() => setViewingMaterial(null)} className="w-full h-12 font-black uppercase rounded-xl">Close Viewer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewSubjectOpen} onOpenChange={setIsNewSubjectOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2">
          <DialogHeader><DialogTitle className="text-xl font-black">{editingSubject ? 'Rename' : 'Create'} Subject Area</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input value={newSubjectInput} onChange={(e) => setNewSubjectInput(e.target.value)} placeholder="e.g. Advanced Negotiation" className="h-12 rounded-xl" />
            <DialogFooter><Button onClick={handleSaveSubject} className="w-full h-11 font-black uppercase rounded-xl">Save Subject</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}