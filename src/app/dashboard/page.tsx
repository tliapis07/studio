'use client';

import { useMemo, useState } from 'react';
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
  DollarSign,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp
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
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

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
      <p className="text-muted-foreground font-headline font-bold">Initializing Sales Environment...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight text-primary">Sales Center</h1>
          <p className="text-sm md:text-base text-muted-foreground">Hello, {user?.displayName || 'Partner'}. Here is your pipeline velocity.</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
           <Button size="sm" variant="outline" className="gap-2"><Clock className="h-4 w-4" /> History</Button>
           <Button size="sm" className="bg-primary gap-2"><TrendingUp className="h-4 w-4" /> Reports</Button>
        </div>
      </div>

      <Collapsible open={isStatsExpanded} onOpenChange={setIsStatsExpanded} className="space-y-2">
        <div className="flex items-center justify-between md:hidden px-1">
           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Performance Overview</span>
           <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                 {isStatsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
           </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-4 md:space-y-0">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
              { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
              { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
              { label: 'Revenue', value: `$${(stats.revenue/1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
            ].map((stat, i) => (
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
                    growth
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CollapsibleContent>
        {/* Force expanded on desktop */}
        <div className="hidden md:grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
              { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
              { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
              { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
            ].map((stat, i) => (
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
      </Collapsible>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Inbound Velocity</CardTitle>
            <CardDescription>Real-time lead arrival trends.</CardDescription>
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
            <CardTitle className="text-lg">AI Sales Insights</CardTitle>
            <CardDescription>Predictive analysis of your current pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {[
               { icon: Zap, text: 'High Velocity: 8 leads predicted to close this week.', color: 'text-primary' },
               { icon: Target, text: 'Opportunity: Win rate for LinkedIn leads up 15%.', color: 'text-accent' },
               { icon: Clock, text: 'At Risk: 3 proposals stalled for > 10 days.', color: 'text-rose-500' }
             ].map((insight, i) => (
               <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-background/50 border border-border/50 group hover:border-primary/20 transition-colors">
                  <div className={`mt-0.5 p-2 rounded-lg bg-muted/30 ${insight.color}`}>
                     <insight.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{insight.text}</p>
               </div>
             ))}
             <Button variant="outline" className="w-full text-xs font-bold gap-2">
                <Sparkles className="h-3 w-3 text-primary" /> Generate Strategy
             </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/40 border-border/50 overflow-hidden shadow-xl">
          <CardHeader className="bg-primary/5 border-b border-border/50 p-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> High-Probability Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {leads?.filter(l => l.leadScore > 75 && l.status !== 'won').slice(0, 4).map((lead, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{lead.company}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <span className="text-[10px] font-black text-primary block">85% SCORE</span>
                       <span className="text-[10px] text-muted-foreground font-bold">${lead.dealValue.toLocaleString()}</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black">HOT</Badge>
                  </div>
                </div>
              )) || <div className="p-8 text-center text-xs text-muted-foreground italic">Pipeline is clear.</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 overflow-hidden shadow-xl">
          <CardHeader className="bg-accent/5 border-b border-border/50 p-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Stream Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {[
                { detail: 'Acme Corp deal closed!', time: '12m ago' },
                { detail: 'Sarah Jenkins moved to Proposal', time: '45m ago' },
                { detail: 'Note added for Wilson Ltd', time: '2h ago' },
                { detail: 'New lead arrived: James Chen', time: '3h ago' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 items-center p-4 hover:bg-muted/10 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-border/50">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-xs text-foreground font-medium">{activity.detail}</p>
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

