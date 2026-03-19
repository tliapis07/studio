'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Target, 
  Award, 
  Clock,
  DollarSign,
  Sparkles,
  Zap,
  History,
  FileText,
  MessageCircle,
  Loader2,
  Mic,
  CheckCircle2,
  ChevronRight
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
import { Lead, Activity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

const MOCK_TEAM = [
  { id: 'user1', name: 'Alex Morgan', role: 'Sales Exec', avatar: 'https://picsum.photos/seed/av1/100/100' },
  { id: 'user2', name: 'Jordan Lee', role: 'Sales Exec', avatar: 'https://picsum.photos/seed/av2/100/100' },
  { id: 'user3', name: 'Sarah Chen', role: 'Sales Exec', avatar: 'https://picsum.photos/seed/av3/100/100' },
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

  useEffect(() => { setMounted(true); }, []);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
  }, [db, user?.uid]);

  const recentActivityQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'activities'), where('ownerUid', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user?.uid]);

  const { data: leads, isLoading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: recentActivities } = useCollection<Activity>(recentActivityQuery);

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
    setTimeout(() => {
      let content = "";
      if (activeStrategicAction === 'script') content = "REPRESENTATIVE: Hi, I'm calling regarding your SalesStream inquiry...\n\nTALKING POINTS:\n1. 20% Velocity Increase\n2. AI Lead Health Monitoring\n3. Integrated Pipeline Automation";
      else if (activeStrategicAction === 'email') content = "Subject: Strategic Growth Partnership\n\nDear Partner,\n\nI noticed your organizational scaling... I'd love to show you how our AI cuts response times by 40%.";
      else content = "OBJECTION: 'It's too expensive.'\nRESPONSE: 'I understand budget concerns. However, the ROI usually clears the seat cost within 3 weeks of live deployment.'";
      
      setStrategicOutput(content);
      setIsGenerating(false);
      toast({ title: "Asset Drafted", description: "Strategic collateral is ready." });
    }, 1500);
  };

  const handleSaveToNotes = async () => {
    if (!db || !user || !strategicOutput) return;
    try {
      await addDocumentNonBlocking(collection(db, 'notes'), {
        ownerUid: user.uid,
        title: `Draft: ${activeStrategicAction?.toUpperCase()} - ${strategicInput.substring(0, 20)}`,
        content: strategicOutput,
        tags: ['Draft', 'AI Generated'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Resource Saved", description: "Template added to your organizational library." });
      setActiveStrategicAction(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    }
  };

  if (!mounted || isUserLoading) return (
    <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
  );

  const statCards = [
    { label: 'Team Totals', value: stats.total, icon: Users, color: 'text-primary', change: '+12%', up: true },
    { label: 'Qualified', value: stats.qualified, icon: Target, color: 'text-accent', change: '+5%', up: true },
    { label: 'Closed', value: stats.won, icon: Award, color: 'text-yellow-500', change: '-2%', up: false },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', change: '+18%', up: true },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">Partner Center</h1>
          <p className="text-muted-foreground font-medium">Real-time organizational velocity diagnostics.</p>
        </div>
        <div className="flex gap-3">
           <Button size="lg" className="bg-primary gap-3 shadow-2xl shadow-primary/30 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest px-8" onClick={() => toast({ title: "Diagnostics Exported" })}><FileText className="h-4 w-4" /> Export Report</Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-2 border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer" onClick={() => router.push('/dashboard/analytics')}>
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-xl bg-muted/20 ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-3xl font-black">{stat.value}</div>
              <p className={`text-[10px] mt-2 font-black ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.up ? '↑' : '↓'} {stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        <Card className="md:col-span-8 bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between p-8">
            <div><CardTitle className="text-xl font-black">Pipeline Velocity</CardTitle><CardDescription className="text-xs">Real-time organizational inbound trends.</CardDescription></div>
            <Select value={repFilter} onValueChange={setRepFilter}>
              <SelectTrigger className="w-[160px] h-10 text-[10px] font-black uppercase bg-background border-2 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Team Force</SelectItem>
                {MOCK_TEAM.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px] p-8 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{name:'M',l:4},{name:'T',l:7},{name:'W',l:5},{name:'T',l:12},{name:'F',l:9}]}>
                <defs><linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                <YAxis fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '2px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="l" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorL)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-4 bg-card/30 border-2 border-border/50 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b-2 bg-muted/10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <History className="h-4 w-4" /> Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivities && recentActivities.length > 0 ? (
              <div className="divide-y-2 divide-border/20">
                {recentActivities.map((act) => (
                  <div key={act.id} className="p-5 flex gap-4 items-start hover:bg-muted/10 cursor-pointer" onClick={() => act.leadId && router.push(`/dashboard/leads/${act.leadId}`)}>
                    <Avatar className="h-8 w-8 border-2 border-primary/20"><AvatarFallback className="text-[10px] font-black">{act.ownerName?.[0]}</AvatarFallback></Avatar>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate">{act.ownerName} <span className="text-muted-foreground font-medium">logged {act.type.replace('_', ' ')}</span></p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 italic">{act.content}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground italic text-[10px] uppercase font-bold tracking-widest">No Recent Team Actions</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card/40 border-2 border-border/50 rounded-3xl shadow-2xl p-8 md:col-span-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Strategic Partner Toolkit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'script', label: 'Call Script', icon: Mic, color: 'text-primary' },
              { id: 'email', label: 'Email Draft', icon: MessageCircle, color: 'text-emerald-500' },
              { id: 'objection', label: 'Objection Pro', icon: Zap, color: 'text-amber-500' },
              { id: 'lead', label: 'Quick Lead', icon: Users, color: 'text-indigo-500', route: '/dashboard/leads' },
            ].map((btn) => (
              <Button key={btn.id} variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-2 hover:bg-primary/5 transition-all shadow-sm" onClick={() => btn.route ? router.push(btn.route) : setActiveStrategicAction(btn.id)}>
                <btn.icon className={`h-6 w-6 ${btn.color}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 flex flex-col justify-center text-center space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live AI Insight</h3>
          <p className="text-xs text-muted-foreground leading-relaxed italic">"Partner, your team conversion from 'Qualified' to 'Proposal' is 18% higher than industry baseline. Excellent velocity."</p>
          <Button variant="link" className="text-primary font-black uppercase text-[10px] p-0" onClick={() => router.push('/dashboard/analytics')}>View Full Diagnostics</Button>
        </Card>
      </div>

      <Dialog open={!!activeStrategicAction} onOpenChange={() => { setActiveStrategicAction(null); setStrategicOutput(''); setStrategicInput(''); }}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3"><Sparkles className="h-6 w-6 text-primary" /> Strategic Asset Generator</DialogTitle>
            <DialogDescription>AI-Powered organizational resources for elite performance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Prospect Persona / Context</Label>
              <Input placeholder="e.g. Acme Corp CTO - Enterprise Scaling" value={strategicInput} onChange={(e) => setStrategicInput(e.target.value)} className="h-12 rounded-xl border-2" />
            </div>
            {strategicOutput && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Strategic Output</Label>
                <div className="p-6 rounded-2xl bg-muted/20 border-2 border-emerald-500/20 max-h-[250px] overflow-y-auto whitespace-pre-wrap text-sm font-medium leading-relaxed shadow-inner">{strategicOutput}</div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            {strategicOutput ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={handleSaveToNotes} className="flex-1 h-12 font-black uppercase rounded-xl border-2"><CheckCircle2 className="h-4 w-4 mr-2" /> Commit to Notes</Button>
                <Button onClick={() => { navigator.clipboard.writeText(strategicOutput); toast({ title: "Copied" }); }} className="flex-1 h-12 font-black uppercase rounded-xl bg-primary shadow-lg">Copy to Clipboard</Button>
              </div>
            ) : (
              <Button disabled={isGenerating || !strategicInput.trim()} onClick={handleGenerateStrategicContent} className="w-full h-12 font-black uppercase rounded-xl bg-primary shadow-xl">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />} Generate Asset
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
