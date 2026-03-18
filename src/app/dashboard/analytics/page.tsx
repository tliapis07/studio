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
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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

  const tabInfo: Record<string, { desc: string; icon: any }> = {
    'Overview': { desc: 'Team-wide performance metrics and organizational quota health.', icon: Target },
    'Pipeline': { desc: 'Step-by-step conversion rates and stage velocity across the team.', icon: Zap },
    'Sources': { desc: 'Lead acquisition performance by channel for all reps.', icon: Calendar },
    'Forecasting': { desc: 'Predictive revenue trends weighted by pipeline stage win rates.', icon: Sparkles },
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Analytics</h1>
          <p className="text-muted-foreground">High-level intelligence and organizational-wide diagnostics.</p>
        </div>
        <Button size="sm" className="bg-primary shadow-lg shadow-primary/20 h-9 font-bold px-6">Export Partner Report</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Team Win Rate', value: '32%', change: '+4%', icon: Target, info: 'Percentage of leads successfully closed as WON across the entire team.' },
          { label: 'Avg Deal Size', value: '$5.2k', change: '+8%', icon: DollarSign, info: 'Mean monetary value of won deals.' },
          { label: 'Sales Cycle', value: '42d', change: '-5d', icon: Clock, info: 'Average time from Lead Creation to Close WON.' },
          { label: 'Sales Velocity', value: '1.2x', change: '+15%', icon: Zap, info: 'Rate at which the team generates revenue.' },
          { label: 'Pipeline Coverage', value: '3.4x', change: '+0.2', icon: ShieldCheck, info: 'Pipeline value divided by remaining team quota.' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                {stat.label}
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help text-muted-foreground/50 hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-[10px] font-medium leading-relaxed">
                      {stat.info}
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
              <stat.icon className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{stat.value}</div>
              <p className={`text-[10px] mt-1 font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change} <span className="text-muted-foreground/60 font-medium">vs last mo</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col gap-4">
          <TabsList className="bg-card/30 border border-border/50 p-1 w-full md:w-fit justify-start h-11">
            {Object.keys(tabInfo).map((tab) => (
              <TabsTrigger key={tab} value={tab} className="px-6 gap-2 text-xs font-bold uppercase tracking-widest h-9">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10 w-fit">
            <Info className="h-4 w-4 text-primary" />
            <span>{tabInfo[activeTab].desc}</span>
          </div>
        </div>

        <TabsContent value="Overview" className="space-y-6 m-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Rep Performance Hub</CardTitle>
                <CardDescription>Individual win rates and quota attainment for active sales force.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMetrics.map((rep, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                          {rep.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{rep.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Win Rate: {rep.winRate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">${rep.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{rep.quota}% of Quota</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <CardTitle className="text-xs font-bold uppercase tracking-widest">Manager AI Insight</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    Team Bottleneck: only <span className="font-bold text-primary">18%</span> Qualified → Proposal across the team. 
                  </p>
                  <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                    <p className="text-[11px] italic leading-relaxed text-muted-foreground">
                      "Partner, the current proposal conversion is 25% below baseline. Consider reviewing team proposal templates and pricing flexibility for next week's reviews."
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full text-[10px] uppercase font-bold tracking-widest h-8 hover:bg-primary/10">Analyze Bottleneck</Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-[2px] ${
                          i % 7 === 1 ? 'bg-primary' : 
                          i % 7 === 2 ? 'bg-primary/70' : 
                          i % 7 === 3 ? 'bg-primary/40' : 'bg-muted/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Mon</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Sun</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Pipeline" className="m-0 animate-in fade-in slide-in-from-top-2 duration-300">
           <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Team Conversion Funnel</CardTitle>
                <CardDescription>Collective movement efficiency across pipeline stages for the entire organization.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40, right: 40, top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }} 
                      itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary), ${1 - index * 0.15})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
