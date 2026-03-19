'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, User, Clock, Tag, TrendingUp, CheckCircle2, Search, Filter, Calendar, Download, Users, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan' },
  { id: 'user2', name: 'Jordan Lee' },
  { id: 'user3', name: 'Sarah Chen' },
];

const ACTION_TYPES = [
  { label: 'All Actions', value: 'all' },
  { label: 'Lead Added', value: 'lead_added' },
  { label: 'Call Logged', value: 'call' },
  { label: 'Note Added', value: 'note' },
  { label: 'Status Changed', value: 'status_change' },
  { label: 'WhatsApp Sent', value: 'whatsapp_sent' },
];

export default function TeamHistoryPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [repFilter, setRepFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Must filter by ownerUid to pass permissions check on root collection
    return query(
      collection(db, 'activities'), 
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(100)
    );
  }, [db, user]);

  const { data: activities, isLoading } = useCollection<any>(historyQuery);

  const filteredActivities = useMemo(() => {
    if (!activities || !mounted) return [];
    return activities.filter(a => {
      const matchesSearch = (a.content || '').toLowerCase().includes(search.toLowerCase()) || 
                            (a.ownerName && a.ownerName.toLowerCase().includes(search.toLowerCase()));
      const matchesRep = repFilter === 'all' || a.ownerUid === repFilter;
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      
      try {
        const date = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        if (!isValid(date)) return true;
        
        const daysAgo = parseInt(dateRange);
        return isWithinInterval(date, { 
          start: subDays(new Date(), daysAgo), 
          end: new Date() 
        });
      } catch {
        return true;
      }
    });
  }, [activities, search, repFilter, typeFilter, dateRange, mounted]);

  const stats = useMemo(() => {
    return {
      total: filteredActivities.length,
      won: filteredActivities.filter(a => a.newStatus === 'won').length,
      topRep: MOCK_TEAM[0]?.name || 'N/A',
    };
  }, [filteredActivities]);

  const handleExport = () => {
    toast({ title: "Export Started", description: "Preparing team activity CSV report." });
    const headers = "Date,User,Action,Content\n";
    const rows = filteredActivities.map(a => {
      const date = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateStr = isValid(date) ? format(date, 'yyyy-MM-dd HH:mm') : 'Unknown';
      return `${dateStr},${a.ownerName || 'Unknown'},${a.type},"${(a.content || '').replace(/"/g, '""')}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-foreground">Team History</h1>
          <p className="text-muted-foreground font-medium">Real-time organizational activity and interaction logs.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="h-12 px-6 rounded-xl border-2 gap-3 font-black uppercase tracking-widest text-[10px]">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search keywords..." 
            className="pl-10 h-11 bg-card/50 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={repFilter} onValueChange={setRepFilter}>
          <SelectTrigger className="h-11 bg-card/50 rounded-xl">
            <UserCheck className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by Rep" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-11 bg-card/50 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-11 bg-card/50 rounded-xl">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-xl">
             <CardHeader className="bg-primary/5 p-8 border-b-2 border-border/50">
               <CardTitle className="text-lg font-black flex items-center gap-3">
                 <History className="h-6 w-6 text-primary" /> Live Activity Feed
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y-2 divide-border/50">
                  {isLoading ? (
                    <div className="p-20 text-center text-muted-foreground italic">Syncing organizational feed...</div>
                  ) : filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, i) => (
                      <div key={activity.id} className="p-6 hover:bg-muted/10 transition-colors flex gap-5 items-start">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback className="font-bold">{activity.ownerName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                             <p className="text-sm font-black">{activity.ownerName || 'Team Member'}</p>
                             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                               <Clock className="h-3 w-3" /> 
                               {activity.createdAt?.toDate ? format(activity.createdAt.toDate(), 'MMM d, h:mm a') : 'Recently'}
                             </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{activity.content}</p>
                          <div className="flex gap-2 mt-2">
                             <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0.5 border-primary/30 text-primary">
                               {activity.type.replace('_', ' ')}
                             </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-20 text-center">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-sm text-muted-foreground italic">No activities match your filters.</p>
                    </div>
                  )}
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 shadow-2xl">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
               <TrendingUp className="h-4 w-4" /> Activity Diagnostics
             </h3>
             <div className="space-y-6">
                {[
                  { label: "Visible Activities", value: stats.total, icon: History },
                  { label: "Successful Closes", value: stats.won, icon: CheckCircle2 },
                  { label: "Velocity Rep", value: stats.topRep, icon: Users },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-5 w-5 text-primary opacity-60" />
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-xl font-black">{stat.value}</span>
                  </div>
                ))}
             </div>
           </Card>

           <Card className="bg-card/50 border-2 border-border/50 rounded-3xl p-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest mb-4">Organizational Insights</CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "Partner, the team has increased 'Call Log' volume by 12% in the last 7 days. Focus on converting these to 'Qualified' status by Monday's review."
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
