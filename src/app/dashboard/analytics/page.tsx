
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
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
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
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
  Users,
  Briefcase
} from 'lucide-react';
import { Lead, TeamMember } from '@/lib/types';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MOCK_TEAM: TeamMember[] = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function TeamAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const db = useFirestore();

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'));
  }, [db]);

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
        velocity: '12 days'
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
    const sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn'];
    return sources.map(s => ({
      name: s,
      value: leads.filter(l => l.source === s).length,
      revenue: leads.filter(l => l.source === s && l.status === 'won').reduce((acc, l) => acc + l.dealValue, 0)
    }));
  }, [leads]);

  const tabInfo: Record<string, { desc: string; icon: any }> = {
    'Overview': { desc: 'Team-wide performance metrics and quota health.', icon: Target },
    'Pipeline': { desc: 'Step-by-step conversion rates across the organization.', icon: Zap },
    'Sources': { desc: 'Lead acquisition performance by channel for the team.', icon: Calendar },
    'Forecasting': { desc: 'Predictive revenue trends by representative.', icon: Sparkles },
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Analytics</h1>
          <p className="text-muted-foreground">High-level intelligence and organization-wide diagnostics.</p>
        </div>
        <Button size="sm" className="bg-primary shadow-lg shadow-primary/20">Export Manager Report</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Team Win Rate', value: '32%', change: '+4%', icon: Target },
          { label: 'Avg Deal Size', value: '$5.2k', change: '+8%', icon: DollarSign },
          { label: 'Sales Cycle', value: '42d', change: '-5d', icon: Clock },
          { label: 'Sales Velocity', value: '1.2x', change: '+15%', icon: Zap },
          { label: 'Pipeline Coverage', value: '3.4x', change: '+0.2', icon: ShieldCheck },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-3 w-3 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{stat.value}</div>
              <p className={`text-[10px] mt-1 font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/30 border border-border/50 p-1 w-full md:w-auto justify-start">
          {Object.keys(tabInfo).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-6">{tab}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview" className="space-y-6 m-0">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Rep Performance Overview</CardTitle>
                <CardDescription>Individual metrics across the sales force.</CardDescription>
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
                          <p className="text-[10px] text-muted-foreground uppercase">Win Rate: {rep.winRate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">${rep.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{rep.quota}% of Quota</p>
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
                    <p className="text-xs italic">Consider unified proposal training to improve conversion velocity.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Team Engagement Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Pipeline" className="space-y-6 m-0">
           <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Team Conversion Funnel</CardTitle>
                <CardDescription>Collective movement efficiency across pipeline stages.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
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
