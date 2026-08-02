"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock,
  Activity,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Plus,
  MoreVertical,
  CalendarDays,
  Target,
  AlertCircle,
  Loader2,
  CalendarPlus,
  Zap
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { AIAppointmentCreator } from "@/components/ai-appointment-creator";
import { ScheduleAnalysisWidget } from "@/components/schedule-analysis-widget";
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
  const [todayStr, setTodayStr] = useState("");
  const [headerDate, setHeaderDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setTodayStr(now.toISOString().split('T')[0]);
    setHeaderDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

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

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { 
        status: status,
        isCompleted: status === 'Done' 
      });
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      await updateDoc(doc(db, "appointments", appId), { attendanceStatus: status });
    } catch (e) {
      console.error("Error updating appointment:", e);
    }
  };

  if (!mounted || authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">Loading Executive Workspace...</p>
    </div>
  );

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done' || t.isCompleted).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalApps = appointments.length;
  const attendedApps = appointments.filter(a => a.attendanceStatus === 'Attended').length;
  const attendanceRate = totalApps > 0 ? Math.round((attendedApps / totalApps) * 100) : 0;

  const productivityScore = Math.round((taskCompletionRate + attendanceRate) / 2);
  const totalItemsCount = totalTasks + totalApps;
  const personalItemsCount = [...appointments, ...tasks].filter(item => item.source === 'manual' || !item.source).length;

  const todayActivities = todayStr ? [
    ...appointments.filter(a => String(a.date) === todayStr).map(a => ({ ...a, type: 'appointment' })),
    ...tasks.filter(t => String(t.date) === todayStr).map(t => ({ ...t, type: 'task' }))
  ].sort((a, b) => String(a.time || '00:00').localeCompare(String(b.time || '00:00'))) : [];

  const upcomingActivities = todayStr ? [
    ...appointments.filter(a => String(a.date) > todayStr).map(a => ({ ...a, type: 'appointment' })),
    ...tasks.filter(t => String(t.date) > todayStr).map(t => ({ ...t, type: 'task' }))
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '00:00').localeCompare(String(b.time || '00:00'))) : [];

  return (
    <AppLayout>
      <div className="flex flex-col gap-10 max-w-7xl mx-auto" dir="ltr">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Workspace Overview</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Organize your tasks, appointments, and daily priorities in one place.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mission Date</p>
            <p className="text-sm font-bold text-primary">{headerDate}</p>
          </div>
        </div>

        {/* Statistics Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Items" 
            value={totalItemsCount} 
            subtitle="Tasks + Appointments"
            description={`${personalItemsCount} manually created`}
            icon={<Activity className="h-5 w-5" />} 
            color="blue"
          />
          <StatCard 
            title="Tasks" 
            value={totalTasks} 
            subtitle={`Completed ${taskCompletionRate}%`}
            description={`${doneTasks} finished items`}
            icon={<CheckSquare className="h-5 w-5" />} 
            color="emerald"
            href="/tasks"
          />
          <StatCard 
            title="Appointments" 
            value={totalApps} 
            subtitle={`Attendance ${attendanceRate}%`}
            description={`${attendedApps} confirmed events`}
            icon={<CalendarIcon className="h-5 w-5" />} 
            color="purple"
            href="/appointments"
          />
        </div>

        {/* Statistics Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CircularStatCard 
            title="Task Completion" 
            percentage={taskCompletionRate} 
            subtitle={`${doneTasks} of ${totalTasks} Completed`}
            color="emerald"
          />
          <CircularStatCard 
            title="Overall Performance" 
            percentage={productivityScore} 
            subtitle={productivityScore > 80 ? "Excellent Performance" : "Steady Mission Progress"}
            color="primary"
          />
        </div>

        {/* AI Performance Analyzer */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ScheduleAnalysisWidget appointments={appointments} tasks={tasks} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" /> Today's Schedule
              </h2>
            </div>
            <div className="space-y-3">
              {todayActivities.length > 0 ? (
                todayActivities.map((item) => (
                  <ActivityRow 
                    key={item.id} 
                    item={item} 
                    onStatusUpdate={item.type === 'task' ? updateTaskStatus : updateAppStatus}
                  />
                ))
              ) : (
                <EmptyState message="No activities scheduled for today." />
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" /> Upcoming Activities
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-primary hover:bg-transparent">
                <Link href="/calendar">View Full Calendar <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingActivities.slice(0, 5).map((item) => (
                <ActivityRow 
                  key={item.id} 
                  item={item} 
                  showDate 
                  onStatusUpdate={item.type === 'task' ? updateTaskStatus : updateAppStatus}
                />
              ))}
              {upcomingActivities.length === 0 && (
                <EmptyState message="No upcoming activities found." />
              )}
            </div>
          </section>
        </div>

        {/* Quick Creation Section */}
        <section className="space-y-6 pt-10 border-t">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Quick Creation Terminal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard 
              icon={CalendarPlus} 
              title="Add Appointment" 
              onClick={() => window.location.href = '/appointments?add=true'}
              color="blue"
            />
            <QuickActionCard 
              icon={CheckSquare} 
              title="Add Task" 
              onClick={() => window.location.href = '/tasks?add=true'}
              color="emerald"
            />
            <QuickActionCard 
              icon={Sparkles} 
              title="AI Assistant" 
              onClick={() => setShowAIDialog(true)}
              color="purple"
            />
          </div>
        </section>
      </div>

      <AIAppointmentCreator 
        isOpen={showAIDialog} 
        onClose={() => setShowAIDialog(false)} 
      />
    </AppLayout>
  );
}

function StatCard({ title, value, subtitle, description, icon, color, href }: any) {
  const isClickable = !!href;
  const colors: any = {
    blue: "text-blue-600 border-blue-100 hover:bg-blue-50/50",
    emerald: "text-emerald-600 border-emerald-100 hover:bg-emerald-50/50",
    purple: "text-purple-600 border-purple-100 hover:bg-purple-50/50",
  };

  const content = (
    <Card className={cn(
      "p-6 border-2 transition-all duration-300 group shadow-sm",
      colors[color] || "bg-card",
      isClickable ? "hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-md cursor-pointer" : "cursor-default"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-inherit">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-foreground transition-all duration-300 group-hover:scale-105 origin-left inline-block">
          {value}
        </h3>
        <p className="text-xs font-bold text-foreground/80">{title}</p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        {description && <p className="text-[10px] italic text-muted-foreground/60 mt-2">{description}</p>}
      </div>
    </Card>
  );

  return isClickable ? <Link href={href} className="focus:outline-none">{content}</Link> : content;
}

function CircularStatCard({ title, percentage, subtitle, color }: any) {
  const colors: any = {
    emerald: "text-emerald-600 stroke-emerald-500",
    primary: "text-primary stroke-primary",
  };

  const safePercentage = Math.min(100, Math.max(0, percentage || 0));

  return (
    <Card className="p-8 border-2 flex flex-col items-center justify-center text-center gap-4 shadow-sm group hover:border-primary/20 transition-all">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <path
            className="stroke-muted fill-none"
            strokeWidth="2.5"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={cn("fill-none transition-all duration-1000 ease-out", colors[color])}
            strokeWidth="2.5"
            strokeDasharray={`${safePercentage}, 100`}
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black group-hover:scale-110 transition-transform">{safePercentage}%</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <p className="text-[10px] font-bold text-foreground/70">{subtitle}</p>
      </div>
    </Card>
  );
}

function ActivityRow({ item, showDate, onStatusUpdate }: any) {
  const isTask = item.type === 'task';
  const status = isTask ? item.status || (item.isCompleted ? 'Done' : 'Pending') : item.attendanceStatus || 'Upcoming';

  const statusColors: any = {
    'Pending': 'bg-orange-100 text-orange-700 border-orange-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Done': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Upcoming': 'bg-purple-100 text-purple-700 border-purple-200',
    'Attended': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Missed': 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          isTask ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
        )}>
          {isTask ? <CheckSquare className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
        </div>
        <div>
          <h4 className={cn("font-bold text-sm", status === 'Done' && "line-through opacity-50")}>{item.title || item.description}</h4>
          <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {showDate && <span>{item.date}</span>}
            {showDate && <span>•</span>}
            <span>{item.time || 'No Time'}</span>
            <span>•</span>
            <span className="text-primary/70">{item.source || 'Manual'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-6 text-[8px] font-black uppercase px-2 rounded-lg", statusColors[status] || "bg-muted text-muted-foreground")}>
              {status}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isTask ? (
              <>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'In Progress')}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'Done')}>Done</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'Upcoming')}>Upcoming</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'Attended')}>Attended</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'Missed')}>Missed</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, onClick, color }: any) {
  const colors: any = {
    blue: "text-blue-600 border-blue-100 hover:bg-blue-50/50",
    emerald: "text-emerald-600 border-emerald-100 hover:bg-emerald-50/50",
    purple: "text-purple-600 border-purple-100 hover:bg-purple-50/50",
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all active:scale-95 text-center gap-2 bg-white shadow-sm",
        colors[color]
      )}
    >
      <div className="p-2 rounded-full bg-white shadow-sm border border-inherit">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-muted/10 opacity-60">
      <AlertCircle className="h-6 w-6 text-muted-foreground" />
      <p className="text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  );
}