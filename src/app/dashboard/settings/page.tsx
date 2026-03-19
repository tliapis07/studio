
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  FileJson,
  Plus,
  Target,
  Info,
  Globe,
  Moon,
  Sun,
  Camera,
  Loader2,
  CheckCircle2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/ThemeProvider';
import { UserProfile } from '@/lib/types';

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", 
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", 
  "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland"
];

const STATUS_OPTIONS = ["Available", "Busy", "In a meeting", "Do not disturb", "Working Remotely"];

export default function SettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileRef = user ? doc(db, 'users', user.uid) : null;
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef as any);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    await setDoc(doc(db, 'users', user.uid), {
      displayName: formData.get('displayName'),
      organization: formData.get('organization'),
      status: formData.get('status'),
      timeZone: formData.get('timeZone'),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setIsSaving(false);
    toast({ title: "Profile Synchronized", description: "Identity details saved organizational-wide." });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profiles/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'users', user.uid), { profilePicURL: url }, { merge: true });
      toast({ title: "Avatar Updated", description: "Your new profile picture is live." });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not save profile picture." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Partner Settings</h1>
          <p className="text-muted-foreground font-medium">Manage organizational structure and partner-view preferences.</p>
        </div>
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl px-4 py-2 flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Online & Synced</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1.5 border-2 border-border/50 w-full md:w-fit justify-start h-14 rounded-2xl">
          <TabsTrigger value="profile" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><User className="h-4 w-4" /> Identity</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><Users className="h-4 w-4" /> Team</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><Database className="h-4 w-4" /> UI & Sync</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><Sparkles className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-card/50 border-2 border-border/50 shadow-xl rounded-3xl overflow-hidden h-fit">
              <CardHeader className="p-8 pb-4 text-center">
                <div className="relative mx-auto w-32 h-32 mb-4 group">
                  <Avatar className="w-full h-full border-4 border-primary/20 shadow-2xl">
                    <AvatarImage src={profile?.profilePicURL || user?.photoURL || ''} />
                    <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{user?.displayName?.[0] || 'P'}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 h-10 w-10 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-xl border-4 border-background hover:scale-110 transition-transform">
                    {isUploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>
                <CardTitle className="text-2xl font-black">{profile?.displayName || user?.displayName || 'Partner'}</CardTitle>
                <CardDescription className="font-bold text-primary uppercase text-[10px] tracking-widest mt-1">Lead Partner @ SalesStream</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                 <div className="p-4 rounded-2xl bg-muted/20 border-2 border-border/50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Status</p>
                    <p className="text-sm font-bold flex items-center justify-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {profile?.status || 'Available'}
                    </p>
                 </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-card/50 border-2 border-border/50 shadow-xl rounded-3xl">
              <CardHeader className="p-8 border-b-2 border-border/50">
                <CardTitle className="text-xl font-black">Identity Details</CardTitle>
                <CardDescription>Professional information synchronized across the team dashboard.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Public Display Name</Label>
                      <Input name="displayName" defaultValue={profile?.displayName || user?.displayName || ''} className="h-12 rounded-xl border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Organization Name</Label>
                      <Input name="organization" defaultValue={profile?.organization || 'SalesStream Global'} className="h-12 rounded-xl border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Global Status</Label>
                      <Select name="status" defaultValue={profile?.status || 'Available'}>
                        <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-2 shadow-xl">
                          {STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Preferred Timezone</Label>
                      <Select name="timeZone" defaultValue={profile?.timeZone || 'UTC'}>
                        <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-2 shadow-xl">
                          {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-muted/10 border-t-2 border-border/50 flex justify-end">
                  <Button type="submit" disabled={isSaving} className="h-12 px-10 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Publish Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black">Visual Interface</CardTitle>
                <CardDescription>Personalize your Partner Portal environment.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest">Portal Theme</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      className="h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] gap-3"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-5 w-5" /> Light Mode
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      className="h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] gap-3"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-5 w-5" /> Dark Mode
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border-2 border-border/50">
                  <div className="space-y-1">
                    <p className="text-sm font-black">Compact Mode</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Smaller fonts & high-density tables</p>
                  </div>
                  <Switch 
                    checked={profile?.compactModeEnabled} 
                    onCheckedChange={(checked) => setDoc(profileRef as any, { compactModeEnabled: checked }, { merge: true })} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black">Synchronization & Sync</CardTitle>
                <CardDescription>Monitor your real-time organizational connection.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                             <Wifi className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                             <p className="text-sm font-black">Firestore Persistence</p>
                             <p className="text-[10px] text-emerald-600 font-bold uppercase">Active & Optimized</p>
                          </div>
                       </div>
                       <Button size="sm" variant="outline" className="text-[9px] font-black uppercase tracking-widest h-8 border-emerald-500/30">Force Sync</Button>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border-2 border-border/50">
                      <div className="space-y-1">
                        <p className="text-sm font-black">Notification Sounds</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Audio alerts for new team activity</p>
                      </div>
                      <Switch 
                        checked={profile?.notificationSoundsEnabled} 
                        onCheckedChange={(checked) => setDoc(profileRef as any, { notificationSoundsEnabled: checked }, { merge: true })} 
                      />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
