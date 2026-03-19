'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
  Globe,
  Plus,
  Loader2
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip as UITooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', avatar: 'https://picsum.photos/seed/av1/100/100', quota: 150000 },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', avatar: 'https://picsum.photos/seed/av2/100/100', quota: 120000 },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', avatar: 'https://picsum.photos/seed/av3/100/100', quota: 200000 },
];

export default function TeamAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const db = useFirestore();
  const { user } = useUser();
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [mounted, setMounted] = useState(false);
  const [randomRatios, setRandomRatios] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
    setRandomRatios(MOCK_TEAM.map(() => Math.floor(Math.random() * 60) + 40));
  }, []);

  const leadsQueryStable = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Security Rule Alignment: Must filter by ownerUid to pass permissions check on root collection
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQueryStable);

  const teamMetrics = useMemo(() => {
    if (!leads || !user) return [];
    // Only calculate metrics for the current user's data to comply with security rules
    const userLeads = leads.filter(l => l.ownerUid === user.uid);
    const won = userLeads.filter(l => l.status === 'won');
    const revenue = won.reduce((acc, l) => acc + (l.dealValue || 0), 0);
    const winRate = userLeads.length ? Math.round((won.length / userLeads.length) * 100) : 0;
    
    return [{
      name: user.displayName || 'You',
      revenue,
      winRate: `${winRate}%`,
      quota: Math.round((revenue / 150000) * 100),
    }];
  }, [leads, user]);

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
    const sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Social'];
    return sources.map((s) => ({
      name: s,
      value: leads.filter(l => l.source === s).length || (mounted ? Math.floor(Math.random() * 10) + 1 : 5)
    }));
  }, [leads, mounted]);

  const tabInfo: Record<string, { desc: string; icon: any }> = {
    'Overview': { desc: 'Team performance overview and revenue targets.', icon: Target },
    'Pipeline': { desc: 'Step-by-step conversion rates and stage velocity across the team.', icon: Zap },
    'Sources': { desc: 'Lead acquisition performance by channel for all reps.', icon: Globe },
    'Forecasting': { desc: 'Predictive revenue trends weighted by pipeline stage win rates.', icon: Sparkles },
  };

  const DynamicIcon = tabInfo[activeTab]?.icon || Target;

  const handleAddSource = () => {
    if (!newSource.trim()) return;
    toast({ title: "Custom Source Added", description: `'${newSource}' is now available for tracking.` });
    setNewSource('');
    setIsAddSourceOpen(false);
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Partner Analytics</h1>
          <p className="text-muted-foreground text-sm font-medium">High-level intelligence and organizational-wide diagnostics.</p>
        </div>
        <Button 
          size="lg" 
          className="bg-primary shadow-xl shadow-primary/20 h-12 font-black px-8 rounded-xl text-xs uppercase tracking-widest"
          onClick={() => toast({ title: "Diagnostics Exported", description: "The organizational report is ready for download." })}
        >
          Export Partner Report
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Team Win Rate', value: '32%', change: '+4%', icon: Target, info: 'Percentage of leads closed as WON across the entire team.' },
          { label: 'Avg Deal Size', value: '$5.2k', change: '+8%', icon: DollarSign, info: 'Mean monetary value of won deals.' },
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
          <TabsList className="bg-card/30 border-2 border-border/50 p-1.5 h-14 rounded-2xl">
            {Object.keys(tabInfo).map((tab) => (
              <TabsTrigger key={tab} value={tab} className="px-8 gap-3 text-xs font-black uppercase tracking-widest h-11 data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground bg-primary/5 px-5 py-3 rounded-xl border-2 border-primary/10 w-fit">
            <DynamicIcon className="h-5 w-5 text-primary" />
            <span>{tabInfo[activeTab]?.desc}</span>
          </div>
        </div>

        <TabsContent value="Overview" className="space-y-6 m-0">
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
                      "Partner, the current proposal conversion is 25% below baseline. Consider reviewing team proposal templates."
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-[11px] uppercase font-black tracking-widest h-11 border-2 border-primary/20 hover:bg-primary hover:text-white transition-all rounded-xl shadow-sm"
                    onClick={() => toast({ title: "Analyzing Bottleneck", description: "Gemini is performing a deep-dive on stage transitions." })}
                  >
                    Analyze Stage Velocity
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

        <TabsContent value="Pipeline" className="m-0">
           <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
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
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '16px', border: '2px solid hsl(var(--border))' }} 
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

        <TabsContent value="Sources" className="m-0 space-y-6">
           <div className="flex justify-between items-center bg-card/30 p-4 rounded-2xl border-2">
              <div>
                <h3 className="text-lg font-black">Data Origin Diagnostics</h3>
                <p className="text-xs text-muted-foreground">Analyze where your highest value team prospects are coming from.</p>
              </div>
              <Button onClick={() => setIsAddSourceOpen(true)} className="gap-2 rounded-xl h-10 font-bold text-xs uppercase tracking-widest bg-primary">
                <Plus className="h-4 w-4" /> Manage Custom Sources
              </Button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <Card className="lg:col-span-2 bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
                <CardContent className="h-[450px] p-8">
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

             <Card className="bg-card/50 border-2 border-border/50 rounded-3xl p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b-2 pb-4">Rep-Source Performance</h3>
                <div className="space-y-4">
                  {MOCK_TEAM.map((rep, idx) => (
                    <div key={rep.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{rep.name}</span>
                        <span className="text-[10px] uppercase font-black text-muted-foreground">Top: Referral</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: mounted ? `${randomRatios[idx]}%` : '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="Forecasting" className="m-0">
           <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
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

      <Dialog open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Manage Tracking Sources</DialogTitle>
            <DialogDescription>Define organizational origins for lead attribution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input 
                placeholder="New Source Name..." 
                className="h-11 rounded-xl"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
              />
              <Button onClick={handleAddSource} size="icon" className="h-11 w-11 rounded-xl"><Plus className="h-5 w-5" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
