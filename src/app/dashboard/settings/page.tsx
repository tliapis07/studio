
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Shield, 
  User, 
  Database, 
  Sparkles, 
  Users, 
  Download, 
  Trash2, 
  FileJson,
  Calendar,
  Mail,
  Zap,
  Plus,
  Briefcase
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const handleExport = (format: string) => {
    toast({ title: "Manager Export Initiated", description: `Compiling full team data into ${format} format...` });
    setTimeout(() => {
      toast({ title: "Export Ready", description: "Team records are ready for download." });
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Team Settings</h1>
        <p className="text-muted-foreground">Customize the organization workspace and manage team performance.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/30 p-1 border border-border/50 w-full overflow-x-auto justify-start">
          <TabsTrigger value="profile" className="gap-2 px-4"><User className="h-4 w-4" /> My Profile</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-4"><Users className="h-4 w-4" /> Team Management</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 px-4"><Sparkles className="h-4 w-4" /> AI & Sync</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-4"><Database className="h-4 w-4" /> Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Manager Profile</CardTitle>
              <CardDescription>Update your personal details as a team lead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Alex" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Morgan" className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Global Role</Label>
                <Input id="role" defaultValue="Managing Partner" readOnly className="bg-muted/50" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 mt-2 font-bold px-8 shadow-lg shadow-primary/20">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Active Representatives</CardTitle>
              <CardDescription>Manage seats, view activity, and set performance quotas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Alex Morgan', role: 'Sales Exec', email: 'alex@stream.io', quota: '$150k' },
                { name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io', quota: '$120k' },
                { name: 'Sarah Chen', role: 'Sales Exec', email: 'sarah@stream.io', quota: '$200k' },
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={`https://picsum.photos/seed/av${i+1}/100/100`} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{member.email} • Quota: {member.quota}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-primary text-xs font-bold">Edit Quota</Button>
                    <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600">Deactivate</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2 border-dashed h-16 border-primary/20 hover:bg-primary/5 transition-all">
                 <Plus className="h-5 w-5 text-primary" /> Invite New Team Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Team AI Configuration</CardTitle>
              <CardDescription>Enable global predictive features for the entire organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Team Predictive Scoring</Label>
                  <p className="text-sm text-muted-foreground">Calculate close probability across all rep pipelines.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Manager Sales Copilot</Label>
                  <p className="text-sm text-muted-foreground">Receive high-level strategy recommendations for team bottlenecks.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Organization Data</CardTitle>
              <CardDescription>Export team records or archive legacy pipelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col gap-1 border-border/50 hover:bg-muted/20" onClick={() => handleExport('CSV')}>
                     <Download className="h-5 w-5 text-primary" />
                     <span className="text-xs font-bold uppercase tracking-widest">Team Leads (CSV)</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-1 border-border/50 hover:bg-muted/20" onClick={() => handleExport('JSON')}>
                     <FileJson className="h-5 w-5 text-accent" />
                     <span className="text-xs font-bold uppercase tracking-widest">Full Team Archive (JSON)</span>
                  </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
