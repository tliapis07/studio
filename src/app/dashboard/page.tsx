'use client';

import { useMemo, useState, useEffect } from 'react';
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
  FileText,
  MessageSquare,
  FileSignature,
  Mail,
  ShieldAlert,
  StickyNote
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Lead, Activity, TeamSettings } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDoc } from '@/firebase';
import { toast } from '@/hooks/use-toast';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [repFilter, setRepFilter] = useState('all');

  useEffect(() => {
    if (user && !isUserLoading) {
      toast({
        title: "Welcome back, Partner",
        description: "Your team's performance data has been synchronized.",
      });
    }
  }, [user, isUserLoading]);

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
    <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-6">
      <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-3xl animate-spin shadow-2xl shadow-primary/20" />
      <div className="space-y-2">
        <p className="text-xl font-black font-headline tracking-tighter text-primary">SYNCING TEAM ENGINE</p>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-50">Establishing secure connection...</p>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Team Totals', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
    { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
    { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
    { label: 'Team Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
  ];

  const quickTools = [
    { title: 'Ask Gemini', icon: MessageSquare, color: 'bg-primary/20 text-primary', desc: 'AI Sales Assistant' },
    { title: 'Call Script', icon: FileSignature, color: 'bg-accent/20 text-accent', desc: 'Custom pitch generator' },
    { title: 'Email Template', icon: Mail, color: 'bg-emerald-500/20 text-emerald-500', desc: 'Outbound templates' },
    { title: 'Objection Handler', icon: ShieldAlert, color: 'bg-rose-500/20 text-rose-500', desc: 'Handle common pushbacks' },
    { title: 'Quick Notes', icon: StickyNote, color: 'bg-yellow-500/20 text-yellow-500', desc: 'Post-call summaries' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">Partner Center</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">Hello, Partner. Here is your team's pipeline velocity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <Button size="lg" variant="outline" className="gap-3 border-2 border-primary/20 hover:bg-primary/5 h-12 rounded-xl font-bold">
             <History className="h-5 w-5 text-primary" /> Team History
           </Button>
           <Button size="lg" className="bg-primary gap-3 shadow-2xl shadow-primary/30 h-12 rounded-xl font-black uppercase tracking-widest text-xs">
             <FileText className="h-5 w-5" /> Generate Team Report
           </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-2 border-border/50 backdrop-blur-xl group hover:border-primary/50 transition-all hover:translate-y-[-4px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2.5 rounded-xl bg-muted/20 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-3xl md:text-4xl font-black font-headline">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-2 font-black">
                {stat.up ? (
                  <span className="text-emerald-500 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight className="h-3 w-3 mr-0.5" /> {stat.change}</span>
                ) : (
                  <span className="text-rose-500 flex items-center bg-rose-500/10 px-2 py-0.5 rounded-full"><ArrowDownRight className="h-3 w-3 mr-0.5" /> {stat.change}</span>
                )}
                vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <div>
              <CardTitle className="text-2xl font-black">Team Inbound Velocity</CardTitle>
              <CardDescription className="text-sm font-medium">Real-time lead arrival trends across the organization.</CardDescription>
            </div>
            <Select value={repFilter} onValueChange={setRepFilter}>
              <SelectTrigger className="w-[180px] h-10 text-xs font-black uppercase tracking-widest bg-background/50 border-2 rounded-xl">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all">All Reps</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[350px] p-8 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="md:col-span-3 space-y-8">
          <Card className="bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black">AI Team Insights</CardTitle>
              <CardDescription className="text-sm font-medium italic">Manager-focused pipeline analysis.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-5">
               {[
                 { icon: Zap, text: 'High Velocity: 8 team leads predicted to close this week.', color: 'text-primary' },
                 { icon: Award, text: 'Top Rep this week: Sarah – 4 qualified leads.', color: 'text-yellow-500' },
                 { icon: ShieldAlert, text: 'At Risk: 3 proposals stalled for > 10 days.', color: 'text-rose-500' }
               ].map((insight, i) => (
                 <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-background/50 border-2 border-border/50 group hover:border-primary/30 transition-all">
                    <div className={`p-3 rounded-xl bg-muted/40 ${insight.color}`}>
                       <insight.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold leading-tight">{insight.text}</p>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl shadow-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Partner AI
            </h3>
            <p className="text-sm font-bold leading-relaxed text-foreground/80">
              "Partner, team activity is up 15% this week. Focus on converting the 4 high-value proposals in Sarah's pipeline."
            </p>
            <Button className="w-full mt-6 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary shadow-xl shadow-primary/20">Ask Partner AI</Button>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="bg-card/40 border-2 border-border/50 overflow-hidden shadow-2xl rounded-3xl">
          <CardHeader className="bg-primary/5 border-b-2 border-border/50 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" /> Team Quota Attainment
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-9 px-4 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/10">Adjust Targets</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {teamQuotaData.map((rep) => (
              <div key={rep.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 p-0.5">
                      <AvatarImage src={rep.avatar} className="rounded-full" />
                      <AvatarFallback className="bg-muted text-xs font-black">{rep.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-base font-black">{rep.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{rep.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-primary">{rep.percent}%</span>
                    <span className="text-[10px] text-muted-foreground block uppercase font-black tracking-widest mt-1">
                      ${rep.currentRevenue.toLocaleString()} / ${(rep.quota / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
                <Progress value={rep.percent} className="h-3 bg-muted/40 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-2 border-border/50 overflow-hidden shadow-2xl rounded-3xl flex flex-col">
          <CardHeader className="bg-muted/10 border-b-2 border-border/50 p-6">
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <Zap className="h-6 w-6 text-accent" /> Sales Toolkit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickTools.map((tool, i) => (
              <button 
                key={i} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border-2 border-transparent hover:border-primary/50 transition-all text-left group shadow-sm hover:shadow-xl"
              >
                <div className={`p-3 rounded-xl ${tool.color} group-hover:scale-110 transition-transform`}>
                   <tool.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black">{tool.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{tool.desc}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
