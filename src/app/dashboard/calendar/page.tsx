
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Lead, CalendarEvent, TeamMember } from '@/lib/types';
import { format, isSameDay, addDays, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const MOCK_TEAM: TeamMember[] = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function CalendarPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [teamFilter, setTeamFilter] = useState('all');
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calendarEvents'));
  }, [db, user]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events?.filter(e => {
      if (teamFilter !== 'all' && e.ownerUid !== teamFilter) return false;
      const start = e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt);
      return isSameDay(start, selectedDate);
    }) || [];
  }, [selectedDate, events, teamFilter]);

  return (
    <div className="space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">SalesStream Calendar</h1>
          <p className="text-muted-foreground font-medium">Synchronized team follow-ups and strategic engagements.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-card/50 p-2 rounded-2xl border-2 border-border/50 shadow-sm">
            <Users className="h-5 w-5 ml-2 text-primary" />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[220px] h-10 border-none bg-transparent font-bold">
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
        <div className="xl:col-span-3">
          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border/50 bg-primary/5 p-8">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-headline">
                    {format(currentMonth, 'MMMM yyyy')}
                  </CardTitle>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
               <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-6",
                  caption: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground w-[14.28%] font-black text-xs uppercase tracking-[0.2em] pb-8 text-center",
                  row: "flex w-full",
                  cell: "h-20 sm:h-32 w-[14.28%] text-center p-1 relative transition-all group",
                  day: "h-full w-full p-2 font-bold text-sm sm:text-base rounded-2xl transition-all border-2 border-transparent hover:bg-muted/50 hover:border-primary/20 flex flex-col items-start justify-start gap-1 overflow-hidden",
                  day_selected: "bg-primary/10 border-primary text-primary shadow-inner",
                  day_today: "border-accent/40 bg-accent/5 font-black text-accent ring-2 ring-accent/10",
                  day_outside: "opacity-30 pointer-events-none grayscale",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-lg h-full">
            <CardHeader className="p-8 border-b-2 border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" /> Daily Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-8">
                <div className="space-y-8">
                  {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((item, i) => (
                      <div key={item.id} className="relative pl-8 border-l-2 border-primary/20 pb-2 group">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-sm" />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {format(item.startAt?.toDate ? item.startAt.toDate() : new Date(item.startAt), 'h:mm a')}
                          </span>
                          <h4 className="text-sm font-black truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-xs text-muted-foreground italic">No events scheduled for this day.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Team Event</DialogTitle>
            <DialogDescription>Add a new meeting or reminder to the team calendar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" placeholder="e.g. Sales Kickoff" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" type="time" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select name="type" defaultValue="meeting">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Optional details..." />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Create Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
