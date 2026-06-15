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
  TrendingUp,
  Loader2,
  Activity,
  Plus,
  ArrowRight,
  Check,
  Cpu,
  Key,
  CalendarPlus,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<"active" | "missing">("missing");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setFormattedDate(`${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);

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

    if (isFirebaseConfigured) {
      const qApps = query(collection(db, "appointments"));
      const qTasks = query(collection(db, "tasks"));
      const qAI = query(collection(db, "ai_logs"), orderBy("createdAt", "desc"), limit(1));

      const unsubApps = onSnapshot(qApps, (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const unsubTasks = onSnapshot(qTasks, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      const unsubAI = onSnapshot(qAI, (snapshot) => {
        if (!snapshot.empty) {
          setLatestInsight(snapshot.docs[0].data());
        }
      });

      return () => { unsubApps(); unsubTasks(); unsubAI(); };
    }
  }, [user]);

  if (authLoading || loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const highPriorityTasks = pendingTasks.filter(t => t.priority === "High");
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="ltr">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline text-primary mb-1">Munazzim Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="gap-1.5 py-1 px-3 border-primary/30 text-primary bg-primary/5">
                <Cpu className="h-3.5 w-3.5" /> Workspace: studio-5856019500
              </Badge>
              <Badge variant={apiKeyStatus === "active" ? "secondary" : "destructive"} className="gap-1.5 py-1 px-3">
                <Key className="h-3.5 w-3.5" />
                {apiKeyStatus === "active" ? "AI Engine Connected" : "AI Offline"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 shadow-lg h-11 px-6 bg-primary text-white hover:bg-primary/90" asChild>
              <Link href="/appointments">
                <CalendarPlus className="h-5 w-5 text-white" /> Add New Appointment
              </Link>
            </Button>
            <Button className="gap-2 shadow-lg h-11 px-6 bg-primary text-white hover:bg-primary/90" asChild>
              <Link href="/tasks">
                <Plus className="h-5 w-5 text-white" /> Add Task
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Tasks" 
            value={tasks.length} 
            icon={<Activity />} 
            color="blue" 
            href="/tasks"
          />
          <StatCard 
            title="Urgent Tasks" 
            value={highPriorityTasks.length} 
            icon={<AlertTriangle />} 
            color="orange" 
            href="/tasks"
          />
          <StatCard 
            title="Completion Rate" 
            value={`${completionRate}%`} 
            icon={<CheckCircle2 />} 
            color="emerald" 
            href="/stats"
          />
          <StatCard 
            title="Appointments" 
            value={appointments.length} 
            icon={<CalendarIcon />} 
            color="purple" 
            href="/appointments"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Workspace Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      task.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground"
                    )}>
                      {task.isCompleted && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={cn("font-medium", task.isCompleted && "line-through text-muted-foreground")}>
                      {task.description}
                    </span>
                  </div>
                  <Badge variant="outline">{task.priority}</Badge>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">No shared tasks found in the database.</p>}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="bg-primary/5 border-primary/20 shadow-inner">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" /> Latest AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                {latestInsight ? (
                  <>
                    <p className="italic font-medium">"{latestInsight.analysis.substring(0, 150)}..."</p>
                    <div className="p-3 bg-white rounded-lg border border-primary/10">
                      <p className="font-bold text-primary mb-1 text-[10px] uppercase tracking-wider">Persisted at:</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(latestInsight.createdAt).toLocaleString()}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">No AI interactions recorded in this workspace group yet.</p>
                )}
                <Button className="w-full mt-2" size="sm" asChild>
                  <Link href="/ai-assistant">Consult Assistant</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-muted bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-primary">System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-primary/5">
                  <span className="text-muted-foreground">Engine Status</span>
                  <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-primary/5">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-bold">{formattedDate}</span>
                </div>
                <Button className="w-full h-9 text-xs gap-2" variant="outline" asChild>
                  <Link href="/ai-assistant">
                    <Sparkles className="h-3.5 w-3.5" />
                    Open AI Assistant
                  </Link>
                </Button>
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
    blue: "from-blue-600 to-blue-700 bg-blue-600",
    emerald: "from-emerald-600 to-emerald-700 bg-emerald-600",
    purple: "from-purple-600 to-purple-700 bg-purple-600",
    orange: "from-orange-500 to-orange-600 bg-orange-500"
  };

  return (
    <Link href={href} className="block transition-transform active:scale-[0.98]">
      <div className={cn("p-6 rounded-2xl bg-gradient-to-br text-white shadow-md hover:shadow-lg transition-all h-full", colors[color])}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
        </div>
        <p className="text-sm opacity-90 mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
    </Link>
  );
}
