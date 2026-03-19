'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Tag as TagIcon,
  StickyNote,
  Check,
  X
} from 'lucide-react';
import { CalendarEvent, TeamMember, Tag } from '@/lib/types';
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  startOfDay,
  isValid
} from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MOCK_TEAM: TeamMember[] = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [teamFilter, setTeamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isDaySummaryOpen, setIsDaySummaryOpen] = useState(false);
  const [isTypeManageOpen, setIsTypeManageOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [editingType, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => { setIsHydrated(true); }, []);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calendarEvents'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const typesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'tags'), where('ownerUid', '==', user.uid), where('type', '==', 'event_type'));
  }, [db, user]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);
  const { data: eventTypes } = useCollection<Tag>(typesQuery);

  const handleSaveType = () => {
    if (!db || !user || !newTypeInput.trim()) return;
    if (editingType) {
      updateDocumentNonBlocking(doc(db, 'tags', editingType.id), { name: newTypeInput.trim(), updatedAt: serverTimestamp() });
      setEditingTag(null);
    } else {
      addDocumentNonBlocking(collection(db, 'tags'), { ownerUid: user.uid, name: newTypeInput.trim(), type: 'event_type', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setNewTypeInput('');
  };

  const calendarDays = useMemo(() => {
    try {
      if (viewMode === 'month') {
        const monthStart = startOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(endOfMonth(monthStart));
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      } else if (viewMode === 'week') {
        return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
      } else return [startOfDay(currentDate)];
    } catch { return []; }
  }, [currentDate, viewMode]);

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    const formData = new FormData(e.currentTarget);
    const date = new Date(`${formData.get('date')}T${formData.get('time')}`);
    if (!isValid(date)) return toast({ variant: "destructive", title: "Invalid Date" });

    addDocumentNonBlocking(collection(db, 'calendarEvents'), {
      ownerUid: user.uid,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      startAt: date,
      eventType: formData.get('type') as any,
      status: 'scheduled',
      allDay: false,
      createdAt: serverTimestamp(),
    });
    setIsNewEventOpen(false);
    toast({ title: "Event Scheduled" });
  };

  const getEventsForDay = (day: Date) => {
    return events?.filter(e => {
      if (teamFilter !== 'all' && e.ownerUid !== teamFilter) return false;
      if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
      const start = e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt);
      return isValid(start) && isSameDay(start, day);
    }) || [];
  };

  if (!isHydrated) return null;

  return (
    <div className="space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h1 className="text-4xl font-black tracking-tight text-primary">Sales Calendar</h1><p className="text-muted-foreground font-medium">Synchronized organizational follow-ups.</p></div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2" onClick={() => setIsTypeManageOpen(true)}><TagIcon className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2 bg-card/50 p-2 rounded-2xl border-2 shadow-sm">
            <Filter className="h-4 w-4 ml-2 text-primary" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-10 border-none bg-transparent font-bold"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                {eventTypes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsNewEventOpen(true)} className="gap-3 bg-primary h-12 px-6 rounded-2xl font-black uppercase text-xs"><Plus className="h-5 w-5" /> New Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-3xl border-2">
            <div className="flex items-center gap-4"><h2 className="text-xl font-black min-w-[180px]">{format(currentDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}</h2><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => setCurrentDate(viewMode==='month'?addMonths(currentDate,1):viewMode==='week'?addWeeks(currentDate,1):addDays(currentDate,1))}><ChevronRight className="h-5 w-5" /></Button></div></div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}><TabsList className="bg-muted/50 p-1 h-12 rounded-2xl"><TabsTrigger value="month" className="text-[10px] font-black uppercase px-6">Month</TabsTrigger><TabsTrigger value="week" className="text-[10px] font-black uppercase px-6">Week</TabsTrigger><TabsTrigger value="day" className="text-[10px] font-black uppercase px-6">Day</TabsTrigger></TabsList></Tabs>
          </div>
          <Card className="bg-card/50 border-2 rounded-3xl overflow-hidden shadow-2xl">
            <div className={cn("grid gap-px bg-border/50", viewMode === 'month' ? "grid-cols-7" : "grid-cols-1")}>
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={idx} onClick={() => { setSelectedDate(day); setIsDaySummaryOpen(true); }} className={cn("bg-card min-h-[140px] p-2 transition-all cursor-pointer", isSameDay(day, new Date()) && "bg-primary/5 border-2 border-primary/20")}>
                    <div className="flex justify-between items-start mb-2 px-1"><span className={cn("text-sm font-black", isSameDay(day, new Date()) ? "bg-primary text-white h-7 w-7 flex items-center justify-center rounded-lg" : "text-muted-foreground")}>{format(day, 'd')}</span></div>
                    <div className="space-y-1">{dayEvents.slice(0, 3).map((e) => (<div key={e.id} className="px-2 py-1 rounded-lg text-[10px] font-bold truncate bg-primary/10 text-primary border border-primary/20">{e.title}</div>))}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="space-y-8">
           <Card className="bg-card/50 border-2 rounded-3xl overflow-hidden shadow-lg h-full">
            <CardHeader className="p-8 border-b-2 bg-muted/20"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /> Agenda: {format(selectedDate, 'MMM d')}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-8">
                {getEventsForDay(selectedDate).length > 0 ? getEventsForDay(selectedDate).map((item) => (
                  <div key={item.id} className="relative pl-8 border-l-4 border-primary/30 pb-6"><div className="absolute -left-[11px] top-0 h-5 w-5 rounded-lg bg-background border-4 border-primary shadow-md" /><div className="flex flex-col gap-1.5"><span className="text-[10px] font-black text-primary uppercase">{item.startAt?.toDate ? format(item.startAt.toDate(), 'h:mm a') : '--:--'}</span><h4 className="text-sm font-black truncate">{item.title}</h4><p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p></div></div>
                )) : (<div className="text-center py-20 opacity-20"><CalendarIcon className="h-16 w-16 mx-auto mb-6" /><p className="text-xs font-black uppercase">No engagements</p></div>)}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isTypeManageOpen} onOpenChange={setIsTypeManageOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2">
          <DialogHeader><DialogTitle className="text-xl font-black">Manage Event Types</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input placeholder="New type..." value={newTypeInput} onChange={(e) => setNewTypeInput(e.target.value)} className="h-11 rounded-xl" />
              <Button onClick={handleSaveType} size="icon" className="h-11 w-11 rounded-xl">{editingType ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</Button>
            </div>
            <div className="space-y-2">
              {eventTypes?.map(type => (
                <div key={type.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border group">
                  <span className="text-sm font-bold uppercase">{type.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingTag(type); setNewTypeInput(type.name); }}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => { if (events?.some(e => e.eventType === type.name)) toast({variant:"destructive",title:"Cannot Delete"}); else deleteDocumentNonBlocking(doc(db, 'tags', type.id)); }}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-2">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase">Schedule Event</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4 pt-4">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Event Title</Label><Input name="title" required className="h-12 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[10px] font-black uppercase">Date</Label><Input name="date" type="date" required defaultValue={format(selectedDate, 'yyyy-MM-dd')} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase">Time</Label><Input name="time" type="time" required className="h-12 rounded-xl" /></div></div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Event Type</Label>
              <Select name="type" required>
                <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent className="rounded-xl border-2">{eventTypes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Description</Label><Input name="description" className="h-12 rounded-xl" /></div>
            <DialogFooter><Button type="submit" className="w-full h-12 shadow-xl font-black uppercase rounded-xl">Create Event</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
