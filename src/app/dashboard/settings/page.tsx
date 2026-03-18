'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const handleExport = (format: string) => {
    toast({ title: "Export Initiated", description: `Compiling your CRM data into ${format} format...` });
    setTimeout(() => {
      toast({ title: "Export Ready", description: "Your data is ready for download." });
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Customize your SalesStream experience and manage team data.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/30 p-1 border border-border/50 w-full overflow-x-auto justify-start">
          <TabsTrigger value="profile" className="gap-2 px-4"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-4"><Users className="h-4 w-4" /> Team</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 px-4"><Sparkles className="h-4 w-4" /> AI & Sync</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-4"><Database className="h-4 w-4" /> Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details and identity.</CardDescription>
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
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" defaultValue="alex.morgan@salesstream.io" readOnly className="bg-muted/50" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 mt-2 font-bold px-8">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage seats and access for your sales organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Alex Morgan', role: 'Admin', email: 'alex@stream.io' },
                { name: 'Jordan Lee', role: 'Sales Exec', email: 'jordan@stream.io' },
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{member.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600">Revoke</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2 border-dashed h-12">
                 <Plus className="h-4 w-4" /> Invite Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>AI & Predictive Sync</CardTitle>
              <CardDescription>Configure intelligent features and external integrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Predictive Lead Scoring</Label>
                  <p className="text-sm text-muted-foreground">Automatically calculate close probability based on interaction history.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">AI Sales Copilot</Label>
                  <p className="text-sm text-muted-foreground">Enable the floating assistant for real-time strategy recommendations.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-4 pt-4 border-t border-border/50">
                 <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Connected Services</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Gmail', icon: Mail, color: 'text-rose-500', connected: true },
                      { name: 'G-Calendar', icon: Calendar, color: 'text-blue-500', connected: true },
                      { name: 'Zapier', icon: Zap, color: 'text-orange-500', connected: false },
                      { name: 'Slack', icon: Bell, color: 'text-purple-500', connected: false }
                    ].map((svc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                        <div className="flex items-center gap-3">
                           <svc.icon className={`h-4 w-4 ${svc.color}`} />
                           <span className="text-sm font-bold">{svc.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className={`text-[10px] font-black uppercase ${svc.connected ? 'text-emerald-500' : 'text-primary'}`}>
                           {svc.connected ? 'Active' : 'Link'}
                        </Button>
                      </div>
                    ))}
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export your records or clean your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col gap-1 border-border/50 hover:bg-muted/20" onClick={() => handleExport('CSV')}>
                     <Download className="h-5 w-5 text-primary" />
                     <span className="text-xs font-bold uppercase tracking-widest">Export Leads (CSV)</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-1 border-border/50 hover:bg-muted/20" onClick={() => handleExport('JSON')}>
                     <FileJson className="h-5 w-5 text-accent" />
                     <span className="text-xs font-bold uppercase tracking-widest">Full DB Snapshot (JSON)</span>
                  </Button>
               </div>
               <div className="pt-6 border-t border-border/50">
                  <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-2 w-full md:w-auto">
                     <Trash2 className="h-4 w-4" /> Clear All Demo Leads
                  </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

