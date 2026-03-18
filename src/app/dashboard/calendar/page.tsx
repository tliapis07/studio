
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
  Users
} from 'lucide-react';
import { Lead, CalendarEvent, TeamMember } from '@/lib/types';
import { format, isSameDay } from 'date-fns';

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
    if (!db) return null;
    return query(collection(db, 'calendarEvents'));
  }, [db]);

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'));
  }, [db]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);
  const { data: leads } = useCollection<Lead>(leadsQuery);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const filteredEvents = events?.filter(e => {
      if (teamFilter !== 'all' && e.ownerUid !== teamFilter) return false;
      return e.startAt && isSameDay(e.startAt.toDate ? e.startAt.toDate() : new Date(e.startAt), selectedDate);
    }) || [];

    const filteredFollowUps = leads?.filter(l => {
      if (teamFilter !== 'all' && l.ownerUid !== teamFilter) return false;
      return l.nextFollowUpAt && isSameDay(l.nextFollowUpAt.toDate ? l.nextFollowUpAt.toDate() : new Date(l.nextFollowUpAt), selectedDate);
    }) || [];
    
    return [
      ...filteredEvents.map(e => ({ ...e, isFollowUp: false })),
      ...filteredFollowUps.map(l => ({ 
        id: `fu-${l.id}`, 
        title: `Follow-up: ${l.name}`, 
        description: `Company: ${l.company}`, 
        eventType: 'follow-up' as const, 
        ownerUid: l.ownerUid,
        isFollowUp: true 
      }))
    ];
  }, [selectedDate, events, leads, teamFilter]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Calendar</h1>
          <p className="text-muted-foreground">Synchronized team follow-ups and meetings.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card/50 p-1 rounded-lg border border-border/50">
            <Users className="h-4 w-4 ml-2 text-muted-foreground" />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[180px] h-9 border-none bg-transparent">
                <SelectValue placeholder="All Team Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Events</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2 bg-primary shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Team Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-primary/5">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Calendar View'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full h-full p-4"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-lg",
                  day_today: "bg-accent/20 text-accent font-bold rounded-lg border border-accent/30",
                  day: "h-14 w-full text-center p-0 font-medium aria-selected:opacity-100 transition-all hover:bg-muted/30",
                  head_cell: "text-muted-foreground w-full font-bold text-xs uppercase tracking-widest pb-4",
                  table: "w-full border-collapse",
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Events for {selectedDate ? format(selectedDate, 'PPP') : 'today'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-all">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        event.eventType === 'follow-up' ? 'bg-blue-500/10 text-blue-500' :
                        event.eventType === 'meeting' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {event.eventType === 'follow-up' ? <Phone className="h-5 w-5" /> :
                         event.eventType === 'meeting' ? <Video className="h-5 w-5" /> :
                         <FileText className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm">{event.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase">{event.eventType}</Badge>
                            <Avatar className="h-5 w-5 border border-border">
                              <AvatarImage src={MOCK_TEAM.find(m => m.id === event.ownerUid)?.avatar} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No events scheduled for the team on this day</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Team Agenda (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] px-6">
                <div className="space-y-6 pb-6">
                  {selectedDayEvents.length > 0 ? selectedDayEvents.slice(0, 10).map((task) => (
                    <div key={task.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-24px] before:w-px before:bg-border">
                      <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary shadow-sm" />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {task.startAt?.toDate ? format(task.startAt.toDate(), 'MMM dd') : 'Today'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold">{MOCK_TEAM.find(m => m.id === task.ownerUid)?.name.split(' ')[0]}</span>
                      </div>
                      <h5 className="text-sm font-bold mt-1 truncate">{task.title}</h5>
                    </div>
                  )) : <div className="py-8 text-center text-xs text-muted-foreground italic">No upcoming agenda.</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
