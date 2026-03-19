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
  WifiOff,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Share2,
  Star,
  MessageSquare,
  Palette,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/ThemeProvider';
import { UserProfile } from '@/lib/types';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/lib/firebase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", 
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", 
  "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland"
];

const STATUS_OPTIONS = ["Available", "Busy", "In a meeting", "Do not disturb", "Working Remotely"];

const BRAND_PRESETS = [
  { name: 'Stream Blue', value: '248 81% 59%' },
  { name: 'Cyber Emerald', value: '160 84% 39%' },
  { name: 'Royal Indigo', value: '262 83% 58%' },
  { name: 'Deep Rose', value: '346 87% 43%' },
  { name: 'Slate Graphite', value: '215 25% 27%' },
  { name: 'Sunset Amber', value: '24 95% 53%' },
];

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme, brandColor, setBrandColor } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileRef = user ? doc(db, 'users', user.uid) : null;
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef as any);

  const handleActionClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;
    handleActionClick();
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
    logEvent('profile_updated', { uid: user.uid });
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      logEvent('account_deleted', { uid: user.uid });
      toast({ title: "Account Terminated", description: "All partner data has been wiped from the system." });
      router.replace('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({ variant: "destructive", title: "Security Halt", description: "This action requires a recent sign-in. Please log out and log back in to verify." });
      } else {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetApp = () => {
    handleActionClick();
    localStorage.clear();
    logEvent('system_reset', { uid: user?.uid });
    window.location.reload();
  };

  const handleShare = async () => {
    handleActionClick();
    const shareData = {
      title: 'SalesStream CRM',
      text: 'Manage your telesales pipeline with SalesStream CRM.',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast({ title: "Link Copied", description: "Partner Portal link copied to clipboard." });
      }
      logEvent('app_shared', { uid: user?.uid });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-primary">Partner Settings</h1>
          <p className="text-muted-foreground font-medium">Manage organizational structure and partner-view preferences.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare} className="rounded-xl h-10 gap-2 font-black uppercase text-[10px] border-2">
            <Share2 className="h-4 w-4" /> Share Portal
          </Button>
          <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl px-4 py-2 flex items-center gap-3 h-10">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Online</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-card/30 p-1.5 border-2 border-border/50 w-full md:w-fit justify-start h-14 rounded-2xl">
          <TabsTrigger value="profile" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><User className="h-4 w-4" /> Identity</TabsTrigger>
          <TabsTrigger value="data" className="gap-2 px-8 h-11 font-black text-xs uppercase tracking-widest rounded-xl"><Database className="h-4 w-4" /> UI & Brand</TabsTrigger>
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
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-14 flex-col gap-1 rounded-2xl border-2 hover:bg-primary/10" onClick={() => toast({ title: "Feedback Form", description: "Opening organizational feedback portal..." })}>
                       <MessageSquare className="h-4 w-4 text-primary" />
                       <span className="text-[8px] font-black uppercase">Feedback</span>
                    </Button>
                    <Button variant="outline" className="h-14 flex-col gap-1 rounded-2xl border-2 hover:bg-primary/10" onClick={() => window.open('https://play.google.com/store', '_blank')}>
                       <Star className="h-4 w-4 text-amber-500" />
                       <span className="text-[8px] font-black uppercase">Rate App</span>
                    </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    onCheckedChange={(checked) => { handleActionClick(); setDoc(profileRef as any, { compactModeEnabled: checked }, { merge: true }); }} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl font-black">Brand Identity</CardTitle>
                </div>
                <CardDescription>Customize the primary text and accent colors organizational-wide.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <Label className="text-xs font-black uppercase tracking-widest">Organizational Palette</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BRAND_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => { handleActionClick(); setBrandColor(preset.value); }}
                      className={cn(
                        "group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:scale-105",
                        brandColor === preset.value ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20"
                      )}
                    >
                      <div 
                        className="h-8 w-8 rounded-full mb-2 shadow-lg ring-2 ring-background" 
                        style={{ backgroundColor: `hsl(${preset.value})` }}
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest text-center">{preset.name}</span>
                      {brandColor === preset.value && (
                        <div className="absolute top-2 right-2 bg-primary text-white p-0.5 rounded-full shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    This setting modifies the <strong>--primary</strong> color variable, altering all headings, buttons, and highlighted text elements to match your brand.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                       <Button size="sm" variant="outline" onClick={handleActionClick} className="text-[9px] font-black uppercase tracking-widest h-8 border-emerald-500/30">Force Sync</Button>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border-2 border-border/50">
                      <div className="space-y-1">
                        <p className="text-sm font-black">Notification Sounds</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Audio alerts for new team activity</p>
                      </div>
                      <Switch 
                        checked={profile?.notificationSoundsEnabled} 
                        onCheckedChange={(checked) => { handleActionClick(); setDoc(profileRef as any, { notificationSoundsEnabled: checked }, { merge: true }); }} 
                      />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-8 animate-in slide-in-from-top-4 duration-300">
           <div className="grid gap-8">
             <Card className="bg-card/50 border-2 border-border/50 rounded-3xl shadow-xl">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black">Maintenance</CardTitle>
                  <CardDescription>Manage local storage and application state.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/20 border-2 border-border/50">
                    <div className="space-y-1">
                      <p className="text-sm font-black">Clear System Cache</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Resets UI preferences and forces a fresh organizational sync.</p>
                    </div>
                    <Button variant="outline" onClick={handleResetApp} className="rounded-xl h-10 gap-2 font-black uppercase text-[10px] border-2">
                      <RefreshCw className="h-4 w-4" /> Reset App
                    </Button>
                  </div>
                </CardContent>
             </Card>

             <Card className="border-2 border-rose-500/20 bg-rose-500/5 rounded-3xl shadow-xl">
                <CardHeader className="p-8 border-b-2 border-rose-500/10">
                  <CardTitle className="text-xl font-black text-rose-500 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6" /> Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible organizational management actions.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-background border-2 border-rose-500/20">
                    <div className="space-y-1">
                      <p className="text-sm font-black">Terminate Partner Account</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Permanently delete your profile and all organizational access.</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
                          <Trash2 className="h-4 w-4" /> Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-2">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black">Final Confirmation</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm leading-relaxed">
                            This action is <span className="text-rose-500 font-bold">PERMANENT</span>. All your leads, scripts, and organizational configurations will be lost. You cannot undo this.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-rose-500 hover:bg-rose-600 rounded-xl font-black uppercase text-[10px]">Confirm Deletion</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
             </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
