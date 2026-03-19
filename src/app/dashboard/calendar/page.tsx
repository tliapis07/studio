
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Settings2
} from 'lucide-react';
import { CalendarEvent, TeamMember } from '@/lib/types';
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
  startOfDay
} from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calendarEvents'));
  }, [db, user]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      return [startOfDay(currentDate)];
    }
  }, [currentDate, viewMode]);

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) return;
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const date = new Date(`${dateStr}T${timeStr}`);

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
    toast({ title: "Event Created", description: "Team event added to schedule." });
  };

  const getEventsForDay = (day: Date) => {
    return events?.filter(e => {
      if (teamFilter !== 'all' && e.ownerUid !== teamFilter) return false;
      const start = e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt);
      return isSameDay(start, day);
    }) || [];
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Sales Calendar</h1>
          <p className="text-muted-foreground font-medium">Synchronized team follow-ups and strategic engagements.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2">
            <Settings2 className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 bg-card/50 p-2 rounded-2xl border-2 border-border/50 shadow-sm">
            <Users className="h-5 w-5 ml-2 text-primary" />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[200px] h-10 border-none bg-transparent font-bold">
                <SelectValue placeholder="All Team Events" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-xl">
                <SelectItem value="all">All Team Events</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsNewEventOpen(true)} className="gap-3 bg-primary shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs">
            <Plus className="h-5 w-5" /> New Team Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-3xl border-2 border-border/50">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black min-w-[180px]">
                {format(currentDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}><ChevronLeft className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}><ChevronRight className="h-5 w-5" /></Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="text-[10px] font-black uppercase tracking-widest rounded-xl h-10 border-2">Today</Button>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-fit">
              <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl">
                <TabsTrigger value="month" className="text-[10px] font-black uppercase px-6 rounded-xl h-10">Month</TabsTrigger>
                <TabsTrigger value="week" className="text-[10px] font-black uppercase px-6 rounded-xl h-10">Week</TabsTrigger>
                <TabsTrigger value="day" className="text-[10px] font-black uppercase px-6 rounded-xl h-10">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <div className={cn(
              "grid gap-px bg-border/50",
              viewMode === 'month' ? "grid-cols-7" : viewMode === 'week' ? "grid-cols-7" : "grid-cols-1"
            )}>
              {viewMode !== 'day' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-muted/30 p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b-2 border-border/50">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);

                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "bg-card min-h-[140px] p-2 transition-all group relative cursor-pointer",
                      !isCurrentMonth && viewMode === 'month' && "bg-muted/10 opacity-40",
                      isToday && "bg-primary/5 border-2 border-primary/20",
                      isSelected && "ring-4 ring-primary ring-inset z-10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 px-1">
                      <span className={cn(
                        "text-sm font-black",
                        isToday ? "bg-primary text-white h-7 w-7 flex items-center justify-center rounded-lg shadow-lg" : "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div 
                          key={event.id}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-transform hover:scale-[1.05] shadow-sm",
                            event.eventType === 'follow-up' ? 'bg-primary/10 text-primary border border-primary/20' :
                            event.eventType === 'meeting' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            'bg-accent/10 text-accent border border-accent/20'
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest px-2 pt-1">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-lg h-full">
            <CardHeader className="p-8 border-b-2 border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" /> {format(selectedDate, 'MMM d')} Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-8">
                <div className="space-y-8">
                  {getEventsForDay(selectedDate).length > 0 ? (
                    getEventsForDay(selectedDate).map((item, i) => (
                      <div key={item.id} className="relative pl-8 border-l-4 border-primary/30 pb-4 group">
                        <div className="absolute -left-[11px] top-0 h-5 w-5 rounded-lg bg-background border-4 border-primary shadow-md group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {format(item.startAt?.toDate ? item.startAt.toDate() : new Date(item.startAt), 'h:mm a')}
                          </span>
                          <h4 className="text-sm font-black truncate group-hover:text-primary transition-colors">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <CalendarIcon className="h-16 w-16 mx-auto mb-6 opacity-10 text-primary" />
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest italic">Free Schedule</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Schedule Team Event</DialogTitle>
            <DialogDescription className="font-medium">Add a new strategic engagement to the team calendar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Event Title</Label>
              <Input id="title" name="title" placeholder="e.g. Sales Kickoff" required className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                <Input id="date" name="date" type="date" required defaultValue={format(selectedDate, 'yyyy-MM-dd')} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Time</Label>
                <Input id="time" name="time" type="time" required className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Event Type</Label>
              <Select name="type" defaultValue="meeting">
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-xl">
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Input id="description" name="description" placeholder="Optional details..." className="h-12 rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest rounded-xl">Create Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
