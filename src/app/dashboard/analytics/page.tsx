'use client';

import { useState, useMemo } from 'react';
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
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const funnelData = [
  { stage: 'New', count: 450, rate: '100%' },
  { stage: 'Contacted', count: 380, rate: '84%' },
  { stage: 'Qualified', count: 240, rate: '63%' },
  { stage: 'Proposal', count: 120, rate: '50%' },
  { stage: 'Won', count: 85, rate: '70%' },
];

const revenueForecastData = [
  { month: 'Current', actual: 67000, projected: 67000 },
  { month: 'Month 1', projected: 82000 },
  { month: 'Month 2', projected: 95000 },
  { month: 'Month 3', projected: 110000 },
];

const sourceData = [
  { name: 'Website', value: 45, winRate: '22%', revenue: 42000 },
  { name: 'Referral', value: 25, winRate: '45%', revenue: 58000 },
  { name: 'Cold Call', value: 20, winRate: '12%', revenue: 15000 },
  { name: 'LinkedIn', value: 10, winRate: '18%', revenue: 22000 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Sales Intelligence</h1>
          <p className="text-muted-foreground">Predictive insights and pipeline performance analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter Range
          </Button>
          <Button size="sm" className="bg-primary">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Win Rate', value: '32%', change: '+4%', icon: Target },
          { label: 'Avg Deal', value: '$5.2k', change: '+8%', icon: DollarSign },
          { label: 'Sales Cycle', value: '42d', change: '-5d', icon: Clock },
          { label: 'Velocity', value: '1.2x', change: '+15%', icon: Zap },
          { label: 'Coverage', value: '3.4x', change: '+0.2', icon: ShieldCheck },
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
        <TabsList className="bg-card/30 border border-border/50 p-1 w-full md:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Projection</CardTitle>
                <CardDescription>Estimated revenue based on pipeline weighted by stage probability.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueForecastData}>
                    <defs>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="projected" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProjected)" strokeWidth={2} />
                    <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <CardTitle className="text-xs font-bold uppercase tracking-widest">AI Opportunity Insight</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    Bottleneck detected: only <span className="font-bold text-primary">18%</span> of Qualified leads move to Proposal. 
                  </p>
                  <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Recommendation</p>
                    <p className="text-xs italic">Consider automating follow-up emails after demos to increase conversion velocity.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Activity Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-[2px] ${
                          i % 5 === 0 ? 'bg-primary' : 
                          i % 3 === 0 ? 'bg-primary/60' : 
                          i % 2 === 0 ? 'bg-primary/20' : 'bg-muted/20'
                        }`}
                        title={`Day ${i+1}: ${Math.floor(Math.random() * 20)} activities`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-4 text-center">Peak activity detected on Tuesdays 10AM - 2PM</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
           <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Movement efficiency between pipeline stages.</CardDescription>
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

        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceData.map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div>
                        <p className="text-sm font-bold">{source.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{source.winRate} Win Rate</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">${source.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

