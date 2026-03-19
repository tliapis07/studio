
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, User, Clock, Tag, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function TeamHistoryPage() {
  const { user } = useUser();
  const db = useFirestore();

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(50));
  }, [db, user]);

  const { data: activities, isLoading } = useCollection(historyQuery);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black font-headline tracking-tight text-foreground">Team History</h1>
        <p className="text-muted-foreground font-medium">Real-time organizational activity and interaction logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-2 border-border/50 rounded-3xl overflow-hidden shadow-xl">
             <CardHeader className="bg-primary/5 p-8 border-b-2 border-border/50">
               <CardTitle className="text-lg font-black flex items-center gap-3">
                 <History className="h-6 w-6 text-primary" /> Live Activity Feed
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y-2 divide-border/50">
                  {isLoading ? (
                    <div className="p-20 text-center text-muted-foreground">Syncing feed...</div>
                  ) : activities && activities.length > 0 ? (
                    activities.map((activity, i) => (
                      <div key={i} className="p-6 hover:bg-muted/10 transition-colors flex gap-5 items-start">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback className="font-bold">{activity.ownerName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                             <p className="text-sm font-black">{activity.ownerName || 'Team Member'}</p>
                             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                               <Clock className="h-3 w-3" /> {activity.createdAt?.toDate ? format(activity.createdAt.toDate(), 'MMM d, h:mm a') : 'Recently'}
                             </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{activity.content}</p>
                          <div className="flex gap-2 mt-2">
                             <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0.5 border-primary/30 text-primary">
                               {activity.type}
                             </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-20 text-center">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-sm text-muted-foreground italic">No organizational activity recorded yet.</p>
                    </div>
                  )}
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 shadow-2xl">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
               <TrendingUp className="h-4 w-4" /> Activity Stats
             </h3>
             <div className="space-y-6">
                {[
                  { label: "Total Activities", value: activities?.length || 0, icon: History },
                  { label: "Successful Closes", value: activities?.filter(a => a.newStatus === 'won').length || 0, icon: CheckCircle2 },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-5 w-5 text-primary opacity-60" />
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-xl font-black">{stat.value}</span>
                  </div>
                ))}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'outline' ? 'border-primary/30 text-primary' : ''} ${className}`}>
      {children}
    </div>
  );
}
