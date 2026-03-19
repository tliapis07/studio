
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import { 
  Target, 
  DollarSign, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip as UITooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function TeamAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const db = useFirestore();
  const { user } = useUser();

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'));
  }, [db, user]);

  const { data: leads } = useCollection<Lead>(leadsQuery);

  const teamMetrics = useMemo(() => {
    if (!leads) return [];
    return MOCK_TEAM.map(member => {
      const memberLeads = leads.filter(l => l.ownerUid === member.id);
      const won = memberLeads.filter(l => l.status === 'won');
      const revenue = won.reduce((acc, l) => acc + l.dealValue, 0);
      const winRate = memberLeads.length ? Math.round((won.length / memberLeads.length) * 100) : 0;
      return {
        name: member.name,
        revenue,
        winRate: `${winRate}%`,
        quota: Math.round((revenue / member.quota) * 100),
      };
    });
  }, [leads]);

  const funnelData = useMemo(() => {
    if (!leads) return [];
    return [
      { stage: 'New', count: leads.filter(l => l.status === 'new').length },
      { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
      { stage: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
      { stage: 'Proposal', count: leads.filter(l => l.status === 'proposal').length },
      { stage: 'Won', count: leads.filter(l => l.status === 'won').length },
    ];
  }, [leads]);

  const sourceData = useMemo(() => {
    if (!leads) return [];
    const sources = ['Website', 'Referral', 'Cold Call', 'Social', 'Other'];
    return sources.map(s => ({
      name: s,
      value: leads.filter(l => l.source === s).length || Math.floor(Math.random() * 10) + 1
    }));
  }, [leads]);

  const tabInfo: Record<string, { desc: string; icon: any }> = {
    'Overview': { desc: 'Team performance overview and revenue targets.', icon: Target },
    'Pipeline': { desc: 'Step-by-step conversion rates and stage velocity across the team.', icon: Zap },
    'Sources': { desc: 'Lead acquisition performance by channel for all reps.', icon: Calendar },
    'Forecasting': { desc: 'Predictive revenue trends weighted by pipeline stage win rates.', icon: Sparkles },
  };

  const DynamicIcon = tabInfo[activeTab].icon;

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Partner Analytics</h1>
          <p className="text-muted-foreground text-sm font-medium">High-level intelligence and organizational-wide diagnostics.</p>
        </div>
        <Button 
          size="lg" 
          className="bg-primary shadow-xl shadow-primary/20 h-12 font-black px-8 rounded-xl text-xs uppercase tracking-widest"
          onClick={() => toast({ title: "Report Exported", description: "The organizational diagnostics are ready for download." })}
        >
          Export Partner Report
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Team Win Rate', value: '32%', change: '+4%', icon: Target, info: 'Percentage of leads successfully closed as WON across the entire team.' },
          { label: 'Avg Deal Size', value: '$5.2k', change: '+8%', icon: DollarSign, iconColor: 'text-primary', info: 'Mean monetary value of won deals.' },
          { label: 'Sales Cycle', value: '42d', change: '-5d', icon: Clock, info: 'Average time from Lead Creation to Close WON.' },
          { label: 'Sales Velocity', value: '1.2x', change: '+15%', icon: Zap, info: 'Rate at which the team generates revenue.' },
          { label: 'Pipeline Coverage', value: '3.4x', change: '+0.2', icon: ShieldCheck, info: 'Pipeline value divided by remaining team quota.' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50 shadow-sm border-2">
            <CardHeader className="p-5 flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                {stat.label}
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help text-muted-foreground/40 hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-[11px] font-bold leading-relaxed bg-popover border-2 border-border p-3">
                      {stat.info}
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary opacity-80" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-black">{stat.value}</div>
              <p className={`text-[11px] mt-1.5 font-black ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change} <span className="text-muted-foreground/50 font-bold ml-1">vs last mo</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <TabsList className="bg-card/30 border-2 border-border/50 p-1.5 h-14 rounded-2xl analytics-tabs-list">
            {Object.keys(tabInfo).map((tab) => (
              <TabsTrigger key={tab} value={tab} className="px-8 gap-3 text-xs font-black uppercase tracking-widest h-11 data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground bg-primary/5 px-5 py-3 rounded-xl border-2 border-primary/10 w-fit">
            <DynamicIcon className="h-5 w-5 text-primary" />
            <span>{tabInfo[activeTab].desc}</span>
          </div>
        </div>

        <TabsContent value="Overview" className="space-y-6 m-0 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-card/50 border-2 border-border/50 rounded-2xl shadow-lg">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black">Rep Performance Hub</CardTitle>
                <CardDescription className="text-sm font-medium">Individual win rates and quota attainment for active sales force.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="space-y-5">
                  {teamMetrics.map((rep, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border-2 border-border/50 hover:border-primary/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm group-hover:bg-primary group-hover:text-white transition-all">
                          {rep.name[0]}
                        </div>
                        <div>
                          <p className="text-base font-black">{rep.name}</p>
                          <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">Win Rate: <span className="text-primary">{rep.winRate}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">${rep.revenue.toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">{rep.quota}% of Quota</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-2 border-primary/20 rounded-2xl shadow-xl">
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center gap-3 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">Manager AI Insight</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <p className="text-sm leading-relaxed font-medium">
                    Team Bottleneck: only <span className="font-black text-primary underline decoration-2">18%</span> Qualified → Proposal across the team. 
                  </p>
                  <div className="bg-background/80 p-5 rounded-2xl border-2 border-primary/10 shadow-inner">
                    <p className="text-[12px] italic leading-relaxed text-muted-foreground font-medium">
                      "Partner, the current proposal conversion is 25% below baseline. Consider reviewing team proposal templates and pricing flexibility for next week's reviews."
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-[11px] uppercase font-black tracking-widest h-11 border-2 border-primary/20 hover:bg-primary hover:text-white transition-all rounded-xl shadow-sm"
                    onClick={() => toast({ title: "Analyzing Bottleneck", description: "Gemini is performing a deep-dive on stage transitions." })}
                  >
                    Analyze Bottleneck
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-2 border-border/50 rounded-2xl shadow-lg">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Engagement Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-md shadow-sm transition-all hover:scale-110 ${
                          i % 7 === 1 ? 'bg-primary' : 
                          i % 7 === 2 ? 'bg-primary/70' : 
                          i % 7 === 3 ? 'bg-primary/40' : 'bg-muted/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-black">Mon</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black">Sun</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Pipeline" className="m-0 animate-in fade-in slide-in-from-top-4 duration-500">
           <Card className="bg-card/50 border-2 border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black">Team Conversion Funnel</CardTitle>
                <CardDescription className="text-sm font-medium">Collective movement efficiency across pipeline stages for the entire organization.</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px] p-8 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 60, right: 60, top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '16px', border: '2px solid hsl(var(--border))', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} 
                      itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'black' }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary), ${1 - index * 0.15})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="Sources" className="m-0 animate-in fade-in slide-in-from-top-4 duration-500">
           <Card className="bg-card/50 border-2 border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black">Lead Source Distribution</CardTitle>
                <CardDescription className="text-sm font-medium">Analyzing where your highest value team prospects are coming from.</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px] p-8 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={150}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary), ${1 - index * 0.15})`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '16px', border: '2px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="Forecasting" className="m-0 animate-in fade-in slide-in-from-top-4 duration-500">
           <Card className="bg-card/50 border-2 border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black">Revenue Forecast (90 Days)</CardTitle>
                <CardDescription className="text-sm font-medium">Weighted probability forecast based on current organizational pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="h-[450px] p-8 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: 'Apr', revenue: 450000 },
                    { month: 'May', revenue: 520000 },
                    { month: 'Jun', revenue: 610000 },
                    { month: 'Jul', revenue: 750000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" fontSize={11} fontWeight="black" />
                    <YAxis fontSize={11} fontWeight="black" />
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '16px', border: '2px solid hsl(var(--border))' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
