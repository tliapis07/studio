
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  PhoneCall
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';

const data = [
  { name: 'Mon', leads: 4 },
  { name: 'Tue', leads: 7 },
  { name: 'Wed', leads: 5 },
  { name: 'Thu', leads: 9 },
  { name: 'Fri', leads: 12 },
  { name: 'Sat', leads: 3 },
  { name: 'Sun', leads: 2 },
];

const pipelineData = [
  { name: 'New', value: 45, fill: 'hsl(var(--chart-1))' },
  { name: 'Contacted', value: 32, fill: 'hsl(var(--chart-2))' },
  { name: 'Qualified', value: 18, fill: 'hsl(var(--chart-3))' },
  { name: 'Proposal', value: 12, fill: 'hsl(var(--chart-4))' },
  { name: 'Won', value: 24, fill: 'hsl(var(--chart-5))' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Executive Overview</h1>
        <p className="text-muted-foreground">Welcome back, Alex. Here is what's happening with your pipeline today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3" /> +12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3" /> +5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-rose-500 flex items-center"><ArrowDownRight className="h-3 w-3" /> -2%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$142,500</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3" /> +18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card/50">
          <CardHeader>
            <CardTitle>Lead Generation</CardTitle>
            <CardDescription>Frequency of new leads arriving this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-card/50">
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
            <CardDescription>Current state of all active deals.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Priority follow-ups for the next 48 hours.</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Sarah Jenkins', action: 'Send Proposal', time: 'Today, 2:00 PM', priority: 'High' },
              { name: 'Mark Wilson', action: 'Introduction Call', time: 'Today, 4:30 PM', priority: 'Medium' },
              { name: 'TechSolutions Inc', action: 'Follow-up Email', time: 'Tomorrow, 10:00 AM', priority: 'Low' },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{task.name}</span>
                  <span className="text-xs text-muted-foreground">{task.action}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold block">{task.time}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 
                    task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions across your team.</CardDescription>
            </div>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'call', user: 'Alex Morgan', detail: 'Completed discovery call with Acme Corp', time: '12m ago' },
              { type: 'status', user: 'System', detail: 'Sarah Jenkins moved to Proposal stage', time: '45m ago' },
              { type: 'note', user: 'Alex Morgan', detail: 'Added technical requirements note to Mark Wilson', time: '2h ago' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{activity.user}</span> {activity.detail}
                  </p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
