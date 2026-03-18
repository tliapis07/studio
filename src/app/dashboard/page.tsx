'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  Sparkles,
  Zap,
  History,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Lead, Activity, TeamSettings } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDoc } from '@/firebase';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [repFilter, setRepFilter] = useState('all');

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'));
  }, [db, user]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(10));
  }, [db, user]);

  const teamSettingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'teamSettings', 'global');
  }, [db, user]);

  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: recentActivities } = useCollection<Activity>(activitiesQuery);
  const { data: settings } = useDoc<TeamSettings>(teamSettingsRef);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, qualified: 0, won: 0, revenue: 0 };
    const filtered = repFilter === 'all' ? leads : leads.filter(l => l.ownerUid === repFilter);
    return {
      total: filtered.length,
      qualified: filtered.filter(l => l.status === 'qualified').length,
      won: filtered.filter(l => l.status === 'won').length,
      revenue: filtered.filter(l => l.status === 'won').reduce((acc, l) => acc + (l.dealValue || 0), 0)
    };
  }, [leads, repFilter]);

  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const count = leads?.filter(l => {
        if (repFilter !== 'all' && l.ownerUid !== repFilter) return false;
        const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
        return isSameDay(d, day);
      }).length || 0;
      
      return {
        name: format(day, 'EEE'),
        leads: count
      };
    });
  }, [leads, repFilter]);

  const teamQuotaData = useMemo(() => {
    return MOCK_TEAM.map(member => {
      const memberRevenue = leads?.filter(l => l.ownerUid === member.id && l.status === 'won')
        .reduce((acc, l) => acc + (l.dealValue || 0), 0) || 0;
      const percent = Math.min(Math.round((memberRevenue / member.quota) * 100), 100);
      return { ...member, currentRevenue: memberRevenue, percent };
    });
  }, [leads]);

  if (isUserLoading || (leadsLoading && !leads)) return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-headline font-bold uppercase tracking-widest text-xs">Syncing Team Data...</p>
    </div>
  );

  const statCards = [
    { label: 'Team Totals', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
    { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
    { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
    { label: 'Team Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight text-primary">Partner Center</h1>
          <p className="text-sm md:text-base text-muted-foreground">Hello, Partner. Here is your team's pipeline velocity.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button size="sm" variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 h-9">
             <History className="h-4 w-4 text-primary" /> Team History
           </Button>
           <Button size="sm" className="bg-primary gap-2 shadow-lg shadow-primary/20 h-9">
             <FileText className="h-4 w-4" /> Generate Team Report
           </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-border/50 backdrop-blur-md group hover:border-primary/50 transition-all hover:translate-y-[-2px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl md:text-3xl font-black font-headline">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                {stat.up ? (
                  <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3" /> {stat.change}</span>
                ) : (
                  <span className="text-rose-500 flex items-center"><ArrowDownRight className="h-3 w-3" /> {stat.change}</span>
                )}
                vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card/30 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Team Inbound Velocity</CardTitle>
              <CardDescription>Real-time lead arrival trends across the organization.</CardDescription>
            </div>
            <Select value={repFilter} onValueChange={setRepFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background/50">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-card/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">AI Team Insights</CardTitle>
            <CardDescription>Manager-focused analysis of the team pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {[
               { icon: Zap, text: 'High Velocity: 8 team leads predicted to close this week.', color: 'text-primary' },
               { icon: Award, text: 'Top Rep this week: Sarah – 4 qualified leads.', color: 'text-yellow-500' },
               { icon: Target, text: 'Bottleneck: Only 18% Qualified → Proposal across the team.', color: 'text-accent' },
               { icon: Clock, text: 'At Risk: 3 proposals stalled for > 10 days.', color: 'text-rose-500' },
               { icon: TrendingUp, text: 'Growth Alert: Referral source is up 40% this quarter.', color: 'text-emerald-500' }
             ].map((insight, i) => (
               <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-background/50 border border-border/50 group hover:border-primary/20 transition-colors">
                  <div className={`mt-0.5 p-2 rounded-lg bg-muted/30 ${insight.color}`}>
                     <insight.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{insight.text}</p>
               </div>
             ))}
             <Button variant="outline" className="w-full text-xs font-bold gap-2 border-primary/20 hover:bg-primary/5">
                <Sparkles className="h-3 w-3 text-primary" /> Generate Team Strategy
             </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/40 border-border/50 overflow-hidden shadow-xl">
          <CardHeader className="bg-primary/5 border-b border-border/50 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Team Quota Attainment
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase">Edit Target</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {teamQuotaData.map((rep) => (
              <div key={rep.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={rep.avatar} />
                      <AvatarFallback className="bg-muted text-xs">{rep.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{rep.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{rep.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-primary">{rep.percent}%</span>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                      ${rep.currentRevenue.toLocaleString()} / ${(rep.quota / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
                <Progress value={rep.percent} className="h-2 bg-muted/30" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 overflow-hidden shadow-xl">
          <CardHeader className="bg-accent/5 border-b border-border/50 p-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Team Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentActivities && recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 items-center p-4 hover:bg-muted/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={MOCK_TEAM.find(m => m.id === activity.ownerUid)?.avatar} />
                      <AvatarFallback className="text-[10px]">{activity.ownerUid?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-xs text-foreground font-medium">
                      <span className="font-bold text-primary">{MOCK_TEAM.find(m => m.id === activity.ownerUid)?.name || 'Rep'}</span> {activity.content}
                    </p>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                      {activity.createdAt?.toDate ? format(activity.createdAt.toDate(), 'h:mm a') : 'Just now'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-xs text-muted-foreground italic">No team activity recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
