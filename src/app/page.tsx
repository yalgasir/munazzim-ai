
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock,
  Activity,
  ArrowRight,
  Cpu,
  CalendarPlus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ScheduleAnalysisDialog } from "@/components/schedule-analysis-dialog";
import { CalendarSyncButton } from "@/components/CalendarSyncButton";
import { AddActions } from "@/components/add-actions";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user || !db || !isFirebaseConfigured) {
      if (!authLoading) setLoading(false);
      return;
    }

    const userId = user.uid || user.id;
    const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
    const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));

    const unsubApps = onSnapshot(qApps, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubApps(); unsubTasks(); };
  }, [user, authLoading]);

  if (!mounted || authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Synchronizing Workspace...</p>
    </div>
  );

  const pendingTasks = (tasks || []).filter(t => !t.isCompleted);
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="ltr">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-4xl font-black font-headline text-primary mb-1 tracking-tight">Munazzim Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 py-1 px-3">
                <Cpu className="h-3.5 w-3.5 mr-1.5" /> {isFirebaseConfigured ? "Cloud Active" : "Local Mode"}
              </Badge>
              <CalendarSyncButton />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AddActions />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Items" value={(tasks?.length || 0) + (appointments?.length || 0)} icon={<Activity />} color="blue" />
          <StatCard title="Pending Tasks" value={pendingTasks.length} icon={<AlertTriangle />} color="orange" href="/tasks" />
          <StatCard title="Completion" value={`${completionRate}%`} icon={<CheckCircle2 />} color="emerald" href="/stats" />
          <StatCard title="Events" value={appointments?.length || 0} icon={<CalendarIcon />} color="purple" href="/appointments" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 md:mb-0">
          <Card className="lg:col-span-2 shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Today's Schedule
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="hover:text-primary">
                <Link href="/calendar" className="gap-1">View Calendar <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {(appointments || []).slice(0, 3).map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/5 bg-white shadow-sm hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2.5 rounded-xl"><Clock className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h4 className="font-bold text-primary">{app.title}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{app.time || 'All Day'} • Source: {app.source || 'manual'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20">{app.type || 'Meeting'}</Badge>
                </div>
              ))}
              {(!appointments || appointments.length === 0) && (
                <div className="text-center py-16 flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 opacity-20" />
                  </div>
                  <p>No upcoming events found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <ScheduleAnalysisDialog appointments={appointments} tasks={tasks} />
            
            <Card className="border-muted bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Workspace Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 pt-2">
                <div className="flex justify-between items-center py-1 border-b border-muted">
                  <span className="text-muted-foreground">Integrations</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Google Cal
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Sync Health</span>
                  <span className="text-primary font-bold">Optimal</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color, href }: any) {
  const colors: any = {
    blue: "bg-blue-600 shadow-blue-100",
    emerald: "bg-emerald-600 shadow-emerald-100",
    purple: "bg-purple-600 shadow-purple-100",
    orange: "bg-orange-500 shadow-orange-100"
  };

  const card = (
    <div className={cn(
      "p-6 rounded-2xl text-white shadow-lg transition-all h-full relative overflow-hidden group", 
      colors[color],
      href && "hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
        {icon}
      </div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 relative z-10">{title}</p>
      <h3 className="text-4xl font-black tracking-tight relative z-10">{value}</h3>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
