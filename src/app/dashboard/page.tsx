
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  PhoneCall,
  DollarSign
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
import { Lead } from '@/lib/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, qualified: 0, won: 0, revenue: 0 };
    return {
      total: leads.length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      won: leads.filter(l => l.status === 'won').length,
      revenue: leads.filter(l => l.status === 'won').reduce((acc, l) => acc + (l.dealValue || 0), 0)
    };
  }, [leads]);

  const pipelineData = useMemo(() => {
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiated', 'won'];
    return stages.map((stage, i) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      value: leads?.filter(l => l.status === stage).length || 0,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`
    }));
  }, [leads]);

  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const count = leads?.filter(l => {
        const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
        return isSameDay(d, day);
      }).length || 0;
      
      return {
        name: format(day, 'EEE'),
        leads: count
      };
    });
  }, [leads]);

  if (isLoading) return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-headline font-bold">Synchronizing Pipeline Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Executive Overview</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName || 'Sales Professional'}. Here is your velocity today.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
          { label: 'Qualified Leads', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
          { label: 'Closed Deals', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
          { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50 backdrop-blur-sm group hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black font-headline">{stat.value}</div>
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
        <Card className="md:col-span-4 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Lead Inbound Velocity</CardTitle>
            <CardDescription>Frequency of new leads arriving this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
        
        <Card className="md:col-span-3 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
            <CardDescription>Current state of all active deals.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: -10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-primary/5 border-b border-border/50 p-4">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Priority Follow-ups</CardTitle>
              <CardDescription className="text-[10px]">High engagement leads needing attention.</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {leads?.filter(l => l.leadScore > 70 && l.status !== 'won').slice(0, 4).map((lead, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{lead.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{lead.company}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <span className="text-[10px] font-bold block text-primary">{lead.leadScore} SCORE</span>
                       <span className="text-[10px] text-muted-foreground">${lead.dealValue.toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black">HOT</Badge>
                  </div>
                </div>
              )) || <div className="p-12 text-center text-xs text-muted-foreground">No high priority leads today.</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-accent/5 border-b border-border/50 p-4">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Stream Activity</CardTitle>
              <CardDescription className="text-[10px]">Real-time pipeline progression.</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {[
                { type: 'won', user: 'System', detail: 'Acme Corp deal closed!', time: '12m ago' },
                { type: 'status', user: 'Alex Morgan', detail: 'Sarah Jenkins moved to Proposal', time: '45m ago' },
                { type: 'note', user: 'Alex Morgan', detail: 'Added technical specs for Wilson Ltd', time: '2h ago' },
                { type: 'lead', user: 'Website', detail: 'New lead arrived: James Chen', time: '3h ago' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 items-center p-4 hover:bg-muted/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                    <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-xs">
                      <span className="font-bold text-foreground">{activity.user}</span> <span className="text-muted-foreground">{activity.detail}</span>
                    </p>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
