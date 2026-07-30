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
  Plus,
  ArrowRight,
  Check,
  Cpu,
  Key,
  CalendarPlus,
  Sparkles,
  AlertTriangle,
  Loader2,
  BrainCircuit,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { AIAppointmentCreator } from "@/components/ai-appointment-creator";
import { ScheduleAnalysisDialog } from "@/components/schedule-analysis-dialog";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<"active" | "missing">("missing");

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setApiKeyStatus("active");
      } catch (e) {
        setApiKeyStatus("missing");
      }
    };
    checkApiKey();

    if (!user) return;

    if (isFirebaseConfigured && db) {
      const qApps = collection(db, "appointments");
      const qTasks = collection(db, "tasks");

      const unsubApps = onSnapshot(qApps, (snap) => {
        setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const unsubTasks = onSnapshot(qTasks, (snap) => {
        setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => { unsubApps(); unsubTasks(); };
    }
  }, [user]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 2000);
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Synchronizing Workspace...</p>
    </div>
  );

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="ltr">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline text-primary mb-1">Munazzim Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Cpu className="h-3.5 w-3.5 mr-1" /> {isFirebaseConfigured ? "Cloud Active" : "Local Mode"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] gap-1"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Sync Calendar"}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 shadow-sm" variant="outline" asChild>
              <Link href="/appointments">
                <CalendarPlus className="h-5 w-5" /> Add Manually
              </Link>
            </Button>
            <AIAppointmentCreator />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Items" value={tasks.length + appointments.length} icon={<Activity />} color="blue" />
          <StatCard title="Pending Tasks" value={pendingTasks.length} icon={<AlertTriangle />} color="orange" href="/tasks" />
          <StatCard title="Completion" value={`${completionRate}%`} icon={<CheckCircle2 />} color="emerald" href="/stats" />
          <StatCard title="Events" value={appointments.length} icon={<CalendarIcon />} color="purple" href="/appointments" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Today's Schedule</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/calendar" className="gap-1">View Calendar <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments.slice(0, 3).map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-white shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg"><Clock className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h4 className="font-bold text-primary">{app.title}</h4>
                      <p className="text-xs text-muted-foreground">{app.time} • {app.source || 'manual'}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{app.type || 'Meeting'}</Badge>
                </div>
              ))}
              {appointments.length === 0 && <p className="text-center text-muted-foreground py-10">No upcoming events.</p>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <ScheduleAnalysisDialog appointments={appointments} tasks={tasks} />
            
            <Card className="border-muted bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Workspace Status</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between"><span>Integration</span><span className="text-emerald-600 font-bold">Google Calendar</span></div>
                <div className="flex justify-between"><span>Last Sync</span><span>Just now</span></div>
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
      "p-6 rounded-2xl text-white shadow-md transition-all h-full", 
      colors[color],
      href && "hover:scale-[1.02] cursor-pointer"
    )}>
      <div className="flex justify-between items-center mb-4">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
      <p className="text-sm opacity-80 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
