'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
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
  Phone,
  Video,
  FileText,
  Users,
  AlertCircle
} from 'lucide-react';
import { Lead, CalendarEvent, TeamMember } from '@/lib/types';
import { format, isSameDay, addDays, isWithinInterval } from 'date-fns';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MOCK_TEAM: TeamMember[] = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function CalendarPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [teamFilter, setTeamFilter] = useState('all');

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calendarEvents'));
  }, [db, user]);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'));
  }, [db, user]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);
  const { data: leads } = useCollection<Lead>(leadsQuery);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const filteredEvents = events?.filter(e => {
      if (teamFilter !== 'all' && e.ownerUid !== teamFilter) return false;
      const start = e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt);
      return isSameDay(start, selectedDate);
    }) || [];

    const filteredFollowUps = leads?.filter(l => {
      if (teamFilter !== 'all' && l.ownerUid !== teamFilter) return false;
      if (!l.nextFollowUpAt) return false;
      const followUp = l.nextFollowUpAt?.toDate ? l.nextFollowUpAt.toDate() : new Date(l.nextFollowUpAt);
      return isSameDay(followUp, selectedDate);
    }) || [];
    
    return [
      ...filteredEvents.map(e => ({ ...e, isFollowUp: false })),
      ...filteredFollowUps.map(l => ({ 
        id: `fu-${l.id}`, 
        title: `Follow-up: ${l.name}`, 
        description: `Company: ${l.company || 'Unknown'}`, 
        eventType: 'follow-up' as const, 
        ownerUid: l.ownerUid,
        startAt: l.nextFollowUpAt,
        isFollowUp: true 
      }))
    ];
  }, [selectedDate, events, leads, teamFilter]);

  const upcomingAgenda = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    const all = [
      ...(events || []).map(e => ({ ...e, date: e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt) })),
      ...(leads || [])
        .filter(l => l.nextFollowUpAt)
        .map(l => ({ 
          id: `fu-${l.id}`, 
          title: `Follow-up: ${l.name}`, 
          ownerUid: l.ownerUid, 
          date: l.nextFollowUpAt?.toDate ? l.nextFollowUpAt.toDate() : new Date(l.nextFollowUpAt),
          eventType: 'follow-up' 
        }))
    ];

    return all
      .filter(item => isWithinInterval(item.date, { start: now, end: nextWeek }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 15);
  }, [events, leads]);

  return (
    <div className="space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Team Calendar</h1>
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
          <Button className="gap-3 bg-primary shadow-xl shadow-primary/20 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs">
            <Plus className="h-5 w-5" /> New Team Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border/50 bg-primary/5 p-8">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-headline">
                    {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Calendar'}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase font-black tracking-widest text-muted-foreground mt-1">
                    Partner Schedule View
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl font-bold">Today</Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
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
                components={{
                  DayContent: ({ date }) => {
                    // Match events for this date
                    const dayEvents = [
                      ...(events || []).filter(e => isSameDay(e.startAt?.toDate ? e.startAt.toDate() : new Date(e.startAt), date)),
                      ...(leads || []).filter(l => l.nextFollowUpAt && isSameDay(l.nextFollowUpAt?.toDate ? l.nextFollowUpAt.toDate() : new Date(l.nextFollowUpAt), date))
                    ];
                    
                    const isUpcomingReminder = isWithinInterval(date, { 
                      start: new Date(), 
                      end: addDays(new Date(), 3) 
                    }) && dayEvents.some(e => e.eventType === 'follow-up');

                    return (
                      <div className="w-full h-full relative flex flex-col gap-1">
                        <span className="relative z-10">{date.getDate()}</span>
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {dayEvents.slice(0, 4).map((e, i) => (
                            <div 
                              key={i} 
                              className={`h-1.5 w-1.5 rounded-full ${
                                e.eventType === 'follow-up' ? 'bg-blue-500' :
                                e.eventType === 'meeting' ? 'bg-emerald-500' :
                                'bg-purple-500'
                              }`} 
                            />
                          ))}
                          {dayEvents.length > 4 && (
                            <span className="text-[8px] font-black text-muted-foreground">+{dayEvents.length - 4}</span>
                          )}
                        </div>
                        {isUpcomingReminder && (
                          <div className="absolute top-1 right-1">
                            <TooltipProvider>
                              <UITooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-rose-500 animate-bounce" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-rose-500 text-white font-bold border-none shadow-xl">
                                  Critical Follow-up Reminder
                                </TooltipContent>
                              </UITooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-lg h-full">
            <CardHeader className="p-8 border-b-2 border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" /> Team Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[700px] p-8">
                <div className="space-y-8">
                  {upcomingAgenda.length > 0 ? (
                    upcomingAgenda.map((item, i) => (
                      <div key={item.id} className="relative pl-8 border-l-2 border-primary/20 pb-2 group">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-sm transition-all group-hover:scale-125 group-hover:bg-primary" />
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                              {format(item.date, 'MMM dd · h:mm a')}
                            </span>
                            <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0">
                              {item.eventType}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-black truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <Avatar className="h-5 w-5 border-2 border-border">
                               <AvatarImage src={MOCK_TEAM.find(m => m.id === item.ownerUid)?.avatar} />
                               <AvatarFallback className="text-[8px]">{item.ownerUid?.[0]}</AvatarFallback>
                             </Avatar>
                             <span className="text-[10px] text-muted-foreground font-bold">
                               {MOCK_TEAM.find(m => m.id === item.ownerUid)?.name}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-xs text-muted-foreground italic">No upcoming tasks for the team.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
