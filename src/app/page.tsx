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
  Sparkles,
  CheckSquare,
  Plus,
  MoreVertical,
  CalendarDays
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ScheduleAnalysisWidget } from "@/components/schedule-analysis-widget";
import { CalendarSyncButton } from "@/components/CalendarSyncButton";
import { AIAppointmentCreator } from "@/components/ai-appointment-creator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

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
      <p className="text-muted-foreground animate-pulse font-medium">Synchronizing Workspace...</p>
    </div>
  );

  const personalItems = [...appointments, ...tasks].filter(item => item.source === 'manual' || !item.source);
  const pendingTasks = (tasks || []).filter(t => !t.isCompleted);
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-10" dir="ltr">
        {/* Refined Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Munazzim Dashboard</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Organize your tasks, appointments, and daily priorities in one place.
            </p>
            <div className="flex items-center gap-3 pt-3">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100/50 py-1 px-3">
                <Cpu className="h-3.5 w-3.5 mr-1.5" /> {isFirebaseConfigured ? "Cloud Active" : "Local Mode"}
              </Badge>
              <CalendarSyncButton />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="h-11 px-6 shadow-lg shadow-primary/20 font-bold gap-2 active:scale-[0.98] transition-transform" asChild>
               <Link href="/ai-assistant">
                 <Sparkles className="h-4 w-4" /> Smart Assistant
               </Link>
            </Button>
          </div>
        </div>

        {/* Quick Actions Integrated Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Quick Creation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard 
              icon={CalendarPlus} 
              title="Add Appointment" 
              description="Schedule a meeting or event manually." 
              href="/appointments?add=true"
              colorClass="bg-blue-500 shadow-blue-100"
            />
            <ActionCard 
              icon={CheckSquare} 
              title="Add Task" 
              description="Create a new personal task manually." 
              href="/tasks?add=true"
              colorClass="bg-emerald-500 shadow-emerald-100"
            />
            <ActionCard 
              icon={Sparkles} 
              title="Use AI Assistant" 
              description="Describe your request in natural language." 
              onClick={() => setShowAIDialog(true)}
              colorClass="bg-purple-500 shadow-purple-100"
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Personal Add-ons" 
            value={personalItems.length} 
            icon={<Activity />} 
            subtitle="Manually created items"
            color="blue" 
          />
          <StatCard 
            title="Pending Tasks" 
            value={pendingTasks.length} 
            icon={<AlertTriangle />} 
            subtitle={`${pendingTasks.length} require attention`}
            color="orange" 
            href="/tasks" 
          />
          <StatCard 
            title="Task Completion" 
            value={`${completionRate}%`} 
            icon={<CheckCircle2 />} 
            subtitle={`${tasks.length - pendingTasks.length} of ${tasks.length} completed`}
            color="emerald" 
            href="/stats" 
          />
          <StatCard 
            title="Appointments" 
            value={appointments?.length || 0} 
            icon={<CalendarIcon />} 
            subtitle="Upcoming events today"
            color="purple" 
            href="/appointments" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Schedule Section */}
          <Card className="lg:col-span-2 shadow-sm border-border/60 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" /> Today's Schedule
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" asChild className="font-semibold text-xs border-primary/20 text-primary hover:bg-primary/5">
                <Link href="/calendar" className="gap-2">View Full Calendar <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {(appointments || []).slice(0, 4).map((app, idx) => (
                <div key={app.id} className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-l-4 border-l-transparent bg-white border shadow-sm transition-all hover:border-primary/20 group relative",
                  idx === 0 && "border-l-primary bg-primary/[0.02]"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", idx === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-base">{app.title}</h4>
                        {idx === 0 && <Badge className="text-[9px] uppercase font-black px-1.5 h-4 bg-primary text-white">Next</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{app.time || 'All Day'}</p>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{app.source || 'manual'}</p>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{app.type || 'Meeting'}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Item</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {(!appointments || appointments.length === 0) && (
                <div className="text-center py-20 flex flex-col items-center gap-4 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">No appointments scheduled.</p>
                    <p className="text-xs">Your agenda is clear for today.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights Panel */}
          <div className="flex flex-col gap-8">
            <ScheduleAnalysisWidget appointments={appointments} tasks={tasks} />
            
            <Card className="border-border/50 bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Workspace Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Cloud Integrations</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Sync Health</span>
                  <span className="text-primary font-bold">Optimal</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-medium">Current Engine</span>
                  <span className="text-foreground font-bold px-2 py-0.5 bg-muted rounded">MythoMax-L2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AIAppointmentCreator 
        isOpen={showAIDialog} 
        onClose={() => setShowAIDialog(false)} 
      />
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color, href, subtitle }: any) {
  const isClickable = !!href;
  
  const colors: any = {
    blue: "text-blue-600 border-blue-100 bg-blue-50/30",
    emerald: "text-emerald-600 border-emerald-100 bg-emerald-50/30",
    purple: "text-purple-600 border-purple-100 bg-purple-50/30",
    orange: "text-orange-600 border-orange-100 bg-orange-50/30"
  };

  const content = (
    <Card className={cn(
      "p-6 border transition-all duration-300 relative overflow-hidden group",
      colors[color],
      isClickable ? "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 cursor-pointer" : "cursor-default"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl border bg-white shadow-sm transition-transform group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {isClickable && <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{title}</p>
        <h3 className="text-3xl font-black tracking-tight text-foreground">{value}</h3>
        {subtitle && <p className="text-[10px] font-medium text-muted-foreground pt-1">{subtitle}</p>}
      </div>
    </Card>
  );

  return isClickable ? <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">{content}</Link> : content;
}

function ActionCard({ icon: Icon, title, description, href, onClick, colorClass }: any) {
  const content = (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm hover:border-primary/30 hover:shadow-lg transition-all group cursor-pointer w-full text-left h-full active:scale-[0.98]">
      <div className={cn("p-3 rounded-xl text-white w-fit shadow-md transition-transform group-hover:scale-110", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-bold text-base mb-1 text-foreground flex items-center gap-2">
          {title} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </h4>
        <p className="text-xs text-muted-foreground leading-snug font-medium">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return <button onClick={onClick} className="block w-full">{content}</button>;
}