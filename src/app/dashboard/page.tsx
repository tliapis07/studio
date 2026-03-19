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
  Loader2,
  FileJson,
  CheckCircle2,
  Mic,
  Send,
  Check
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [activeStrategicAction, setActiveStrategicAction] = useState<string | null>(null);
  const [strategicInput, setStrategicInput] = useState('');
  const [strategicOutput, setStrategicOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user?.uid]);

  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);

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

  const handleGenerateStrategicContent = () => {
    if (!strategicInput.trim()) return;
    setIsGenerating(true);
    // Mimic high-performance generation
    setTimeout(() => {
      let content = "";
      if (activeStrategicAction === 'script') content = "REPRESENTATIVE: Hi, I'm calling from SalesStream regarding your inquiry...\n\nKEY TALKING POINTS:\n1. Efficiency gains (20%+)\n2. Seamless Firebase integration\n3. AI Strategic assistance...";
      else if (activeStrategicAction === 'email') content = "Subject: Strategic Growth with SalesStream\n\nDear Partner,\n\nI noticed your organization is scaling rapidly. I'd love to discuss how our AI assistance can cut your response times by 40%...";
      else content = "OBJECTION: 'It's too expensive.'\nRESPONSE: 'I understand budget is key. However, the 15% increase in lead velocity we typically see pays for the seat in 3 weeks...'";
      
      setStrategicOutput(content);
      setIsGenerating(false);
      toast({ title: "Content Generated", description: "Strategic asset ready for use." });
    }, 1500);
  };

  if (!mounted || isUserLoading) return (
    <div className="flex flex-col h-screen items-center justify-center p-8 text-center space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      <div className="space-y-2"><p className="text-xl font-black font-headline tracking-tighter text-primary uppercase">Syncing organizational records...</p></div>
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
           <Button size="lg" variant="outline" className="gap-3 border-2 border-primary/20 h-12 rounded-xl font-bold" onClick={() => router.push('/dashboard/team-history')}><History className="h-5 w-5 text-primary" /> Team History</Button>
           <Button size="lg" className="bg-primary gap-3 shadow-2xl shadow-primary/30 h-12 rounded-xl font-black uppercase text-xs" onClick={() => toast({ title: "Report Ready", description: "The organizational diagnostics are compiled." })}><FileText className="h-5 w-5" /> Export Report</Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-2 border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer" onClick={() => router.push('/dashboard/analytics')}>
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2.5 rounded-xl bg-muted/20 ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-3xl md:text-4xl font-black font-headline">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground mt-2 font-black">
                {stat.up ? <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">↑ {stat.change}</span> : <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">↓ {stat.change}</span>} vs last mo
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <div><CardTitle className="text-2xl font-black">Team Velocity</CardTitle><CardDescription className="text-sm font-medium">Real-time organizational inbound trends.</CardDescription></div>
            <Select value={repFilter} onValueChange={setRepFilter}>
              <SelectTrigger className="w-[180px] h-10 text-xs font-black uppercase bg-background/50 border-2 rounded-xl"><SelectValue placeholder="All Reps" /></SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all">All Team Force</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[350px] p-8 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{name:'Mon',leads:4},{name:'Tue',leads:7},{name:'Wed',leads:5},{name:'Thu',leads:12},{name:'Fri',leads:9},{name:'Sat',leads:3},{name:'Sun',leads:2}]}>
                <defs><linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" fontSize={11} fontWeight="black" />
                <YAxis fontSize={11} fontWeight="black" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="md:col-span-3 space-y-8">
          <Card className="bg-card/40 border-2 border-border/50 rounded-3xl shadow-2xl p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Strategic Partner Toolkit</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5" onClick={() => setActiveStrategicAction('script')}>
                <Mic className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Call Script</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5" onClick={() => setActiveStrategicAction('email')}>
                <MessageCircle className="h-6 w-6 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Email Drafter</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5" onClick={() => setActiveStrategicAction('objection')}>
                <Zap className="h-6 w-6 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Objection Pro</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5" onClick={() => router.push('/dashboard/leads')}>
                <Users className="h-6 w-6 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Quick Lead</span>
              </Button>
            </div>
            <Button className="w-full mt-6 h-12 rounded-xl font-black uppercase text-xs bg-primary shadow-xl" onClick={() => toast({ title: "Opening Strategist", description: "Gemini is loading your context..." })}>Ask Gemini Intelligence</Button>
          </Card>

          <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8"><h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Live AI Insight</h3><p className="text-xs text-muted-foreground leading-relaxed italic">"Partner, your team conversion from 'Qualified' to 'Proposal' is 18% higher than industry baseline this week. Excellent velocity."</p></Card>
        </div>
      </div>

      <Dialog open={!!activeStrategicAction} onOpenChange={() => { setActiveStrategicAction(null); setStrategicOutput(''); setStrategicInput(''); }}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3"><Sparkles className="h-6 w-6 text-primary" /> Strategic {activeStrategicAction === 'script' ? 'Call Script' : activeStrategicAction === 'email' ? 'Email Drafter' : 'Objection Pro'}</DialogTitle>
            <DialogDescription>AI-Powered organizational assets for elite sales performance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase">Core Subject / Prospect Name</Label>
              <Input placeholder="e.g. Acme Corp IT Director" value={strategicInput} onChange={(e) => setStrategicInput(e.target.value)} className="h-12 rounded-xl" />
            </div>
            {strategicOutput && (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-emerald-500">Generated Strategic Content</Label>
                <div className="p-6 rounded-2xl bg-muted/20 border-2 border-emerald-500/20 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm font-medium leading-relaxed">{strategicOutput}</div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            {strategicOutput ? (
              <Button onClick={() => { navigator.clipboard.writeText(strategicOutput); toast({ title: "Copied", description: "Strategic asset saved to clipboard." }); }} className="flex-1 h-12 font-black uppercase rounded-xl gap-2"><FileText className="h-4 w-4" /> Copy Asset</Button>
            ) : (
              <Button disabled={isGenerating || !strategicInput.trim()} onClick={handleGenerateStrategicContent} className="flex-1 h-12 font-black uppercase rounded-xl gap-2 bg-primary">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Generate Asset</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}