
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Clock, 
  Calendar as CalendarIcon,
  Phone,
  Video,
  FileText
} from 'lucide-react';
import { Lead, CalendarEvent } from '@/lib/types';
import { format, isSameDay } from 'date-fns';

export default function CalendarPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'calendarEvents'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const { data: events } = useCollection<CalendarEvent>(eventsQuery);
  const { data: leads } = useCollection<Lead>(leadsQuery);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const directEvents = events?.filter(e => e.startAt && isSameDay(e.startAt.toDate ? e.startAt.toDate() : new Date(e.startAt), selectedDate)) || [];
    const leadFollowUps = leads?.filter(l => l.nextFollowUpAt && isSameDay(l.nextFollowUpAt.toDate ? l.nextFollowUpAt.toDate() : new Date(l.nextFollowUpAt), selectedDate)) || [];
    
    return [
      ...directEvents.map(e => ({ ...e, isFollowUp: false })),
      ...leadFollowUps.map(l => ({ 
        id: `fu-${l.id}`, 
        title: `Follow-up: ${l.name}`, 
        description: `Company: ${l.company}`, 
        eventType: 'follow-up' as const, 
        isFollowUp: true 
      }))
    ];
  }, [selectedDate, events, leads]);

  const upcomingTasks = useMemo(() => {
    const all = [
      ...(events || []),
      ...(leads?.filter(l => l.nextFollowUpAt).map(l => ({
        id: l.id,
        title: `Follow-up ${l.name}`,
        startAt: l.nextFollowUpAt,
        eventType: 'follow-up' as const
      })) || [])
    ].sort((a, b) => {
      const dateA = a.startAt?.toDate ? a.startAt.toDate() : new Date(a.startAt);
      const dateB = b.startAt?.toDate ? b.startAt.toDate() : new Date(b.startAt);
      return dateA.getTime() - dateB.getTime();
    });
    return all.filter(item => {
      const d = item.startAt?.toDate ? item.startAt.toDate() : new Date(item.startAt);
      return d >= new Date();
    }).slice(0, 10);
  }, [events, leads]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Calendar</h1>
          <p className="text-muted-foreground">Synchronized follow-ups and meetings.</p>
        </div>
        <Button className="gap-2 bg-primary">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
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
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg",
                  day_today: "bg-accent text-accent-foreground font-bold rounded-lg border border-primary/20",
                  day: "h-14 w-full text-center p-0 font-medium aria-selected:opacity-100",
                  head_cell: "text-muted-foreground w-full font-bold text-xs uppercase tracking-widest pb-4",
                  table: "w-full border-collapse",
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Events for {selectedDate ? format(selectedDate, 'PPP') : 'today'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors">
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
                          <Badge variant="outline" className="text-[10px]">{event.eventType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No events scheduled for this day</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Upcoming Agenda</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] px-6">
                <div className="space-y-6 pb-6">
                  {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                    <div key={task.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-24px] before:w-px before:bg-border">
                      <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {format(task.startAt?.toDate ? task.startAt.toDate() : new Date(task.startAt), 'MMM dd')}
                      </span>
                      <h5 className="text-sm font-bold mt-1">{task.title}</h5>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(task.startAt?.toDate ? task.startAt.toDate() : new Date(task.startAt), 'h:mm a')}
                      </div>
                    </div>
                  )) : <div className="py-8 text-center text-xs text-muted-foreground italic">No upcoming tasks.</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
