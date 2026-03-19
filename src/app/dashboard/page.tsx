'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Target, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  Sparkles,
  Zap,
  History,
  FileText,
  Bell,
  Calendar as CalendarIcon,
  MessageCircle,
  Phone,
  Loader2
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
import { Lead } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [repFilter, setRepFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user?.uid]);

  const followUpsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'leads'), 
      where('ownerUid', '==', user.uid),
      where('nextFollowUpAt', '!=', null), 
      orderBy('nextFollowUpAt', 'asc'), 
      limit(5)
    );
  }, [db, user?.uid]);

  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: followUps } = useCollection<Lead>(followUpsQuery);

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
    if (!mounted) return [];
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const count = leads?.filter(l => {
        if (repFilter !== 'all' && l.ownerUid !== repFilter) return false;
        try {
          const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
          return isSameDay(d, day);
        } catch {
          return false;
        }
      }).length || 0;
      
      return {
        name: format(day, 'EEE'),
        leads: count
      };
    });
  }, [leads, repFilter, mounted]);

  if (!mounted || isUserLoading) return (
    <div className="flex flex-col h-screen items-center justify-center p-8 text-center space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      <div className="space-y-2">
        <p className="text-xl font-black font-headline tracking-tighter text-primary">INITIALIZING PARTNER CORE</p>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-50">Syncing organizational records...</p>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Team Totals', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
    { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
    { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
    { label: 'Team Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">Partner Center</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">Hello, Partner. Here is your team's pipeline velocity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <Button 
            size="lg" 
            variant="outline" 
            className="gap-3 border-2 border-primary/20 hover:bg-primary/5 h-12 rounded-xl font-bold"
            onClick={() => router.push('/dashboard/team-history')}
          >
             <History className="h-5 w-5 text-primary" /> Team History
           </Button>
           <Button 
            size="lg" 
            className="bg-primary gap-3 shadow-2xl shadow-primary/30 h-12 rounded-xl font-black uppercase tracking-widest text-xs"
            onClick={() => toast({ title: "Generating Report", description: "Compiling organizational data for export." })}
          >
             <FileText className="h-5 w-5" /> Generate Team Report
           </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 stat-cards-grid">
        {statCards.map((stat, i) => (
          <Card 
            key={i} 
            className="bg-card/40 border-2 border-border/50 backdrop-blur-xl group hover:border-primary/50 transition-all hover:translate-y-[-4px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
            onClick={() => router.push('/dashboard/analytics')}
          >
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
        <Card className="md:col-span-4 bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden velocity-chart-card">
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
          <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl shadow-xl ai-insights-card overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-primary/10">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Active Follow-Ups
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Team Reminders Engine</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-primary/10">
                 {followUps && followUps.length > 0 ? followUps.map((lead) => {
                   try {
                     const date = lead.nextFollowUpAt?.toDate ? lead.nextFollowUpAt.toDate() : new Date(lead.nextFollowUpAt);
                     const isOverdue = isBefore(date, new Date());
                     return (
                      <div key={lead.id} className="p-5 flex items-center justify-between hover:bg-primary/5 transition-all group">
                         <div className="flex items-center gap-4">
                           <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${isOverdue ? 'bg-rose-500 text-white' : 'bg-primary/20 text-primary'}`}>
                             {isOverdue ? '!' : lead.name[0]}
                           </div>
                           <div>
                             <p className="text-sm font-black group-hover:text-primary transition-colors">{lead.name}</p>
                             <p className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`}>
                               {format(date, 'MMM d, h:mm a')}
                             </p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/leads/${lead.id}`)} className="h-8 w-8 rounded-lg">
                             <Zap className="h-4 w-4" />
                           </Button>
                         </div>
                      </div>
                     );
                   } catch {
                     return null;
                   }
                 }) : (
                  <div className="p-12 text-center">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-20 text-primary" />
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic">All caught up! No pending follow-ups.</p>
                  </div>
                 )}
               </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-2 border-border/50 rounded-3xl shadow-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Partner Toolkit
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5 group" onClick={() => router.push('/dashboard/leads')}>
                <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Add Lead</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:bg-emerald-500/5 group" onClick={() => router.push('/dashboard/contacts')}>
                <MessageCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
              </Button>
            </div>
            <Button 
              className="w-full mt-4 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary shadow-xl shadow-primary/20"
              onClick={() => toast({ title: "AI Assistant", description: "Opening Gemini Sales Strategist..." })}
            >
              Ask Gemini AI
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
