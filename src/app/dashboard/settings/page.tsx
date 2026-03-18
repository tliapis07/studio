
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Shield, User, Database, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and CRM configurations.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/30 p-1 border border-border/50">
          <TabsTrigger value="profile" className="gap-2 px-4"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 px-4"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 px-4"><Sparkles className="h-4 w-4" /> AI Configuration</TabsTrigger>
          <TabsTrigger value="security" className="gap-2 px-4"><Shield className="h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue="alex.morgan@salesstream.io" readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job Title</Label>
                <Input id="job" defaultValue="Senior Account Executive" className="bg-background/50" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 mt-2">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>AI Copilot Settings</CardTitle>
              <CardDescription>Configure how the AI assistant interacts with your data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Systematic Reasoning</Label>
                  <p className="text-sm text-muted-foreground">Force AI to show its "chain-of-thought" process before suggesting actions.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Automated Lead Scoring</Label>
                  <p className="text-sm text-muted-foreground">Automatically update lead scores based on AI analysis of interactions.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiTone">AI Response Tone</Label>
                <select id="aiTone" className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm">
                  <option>Professional & Analytical</option>
                  <option>Casual & Encouraging</option>
                  <option>Direct & Concise</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control when and how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Receive a morning briefing of your tasks and meetings.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">New Lead Alert</Label>
                  <p className="text-sm text-muted-foreground">Instant notifications when a new lead enters your pipeline.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Deal Progress Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a lead moves through pipeline stages.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
