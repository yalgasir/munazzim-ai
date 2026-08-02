
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
  Sparkles,
  CheckSquare,
  Plus,
  MoreVertical,
  CalendarDays,
  Target,
  Circle,
  PlayCircle,
  Loader2,
  CalendarPlus,
  UserCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
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

  // Stats Calculations
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done' || t.isCompleted).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalApps = appointments.length;
  const attendedApps = appointments.filter(a => a.attendanceStatus === 'Attended').length;
  const attendanceRate = totalApps > 0 ? Math.round((attendedApps / totalApps) * 100) : 0;

  const productivityScore = Math.round((taskCompletionRate + attendanceRate) / 2);
  const totalItemsCount = totalTasks + totalApps;
  const personalItemsCount = [...appointments, ...tasks].filter(item => item.source === 'manual' || !item.source).length;

  // Schedule Filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = [
    ...appointments.filter(a => a.date === todayStr).map(a => ({ ...a, type: 'appointment' })),
    ...tasks.filter(t => t.date === todayStr).map(t => ({ ...t, type: 'task' }))
  ].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const upcomingActivities = [
    ...appointments.filter(a => a.date > todayStr).map(a => ({ ...a, type: 'appointment' })),
    ...tasks.filter(t => t.date > todayStr).map(t => ({ ...t, type: 'task' }))
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'));

  return (
    <AppLayout>
      <div className="flex flex-col gap-12 max-w-7xl mx-auto" dir="ltr">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Manage your daily performance and upcoming mission milestones.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Date</p>
            <p className="text-lg font-bold text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Executive Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
          <CircularStatCard 
            title="Task Completion" 
            percentage={taskCompletionRate} 
            subtitle={`${doneTasks} of ${totalTasks} Done`}
            color="emerald"
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
          <CircularStatCard 
            title="Overall Performance" 
            percentage={productivityScore} 
            subtitle={productivityScore > 80 ? "Excellent Productivity" : "Steady Progress"}
            color="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Today's Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" /> Today's Schedule
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

          {/* Upcoming Activities */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-primary" /> Upcoming Activities
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-primary">
                <Link href="/calendar">View Full Calendar <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingActivities.slice(0, 6).map((item) => (
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

        {/* Quick Creation - Now at bottom */}
        <section className="space-y-6 pt-10 border-t">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Quick Creation</h2>
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
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    purple: "text-purple-600 bg-purple-50/50 border-purple-100",
  };

  const content = (
    <Card className={cn(
      "p-6 border-2 transition-all duration-300 group",
      colors[color] || "bg-card",
      isClickable ? "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl cursor-pointer" : "cursor-default"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-white shadow-sm border">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-black text-foreground transition-all group-hover:scale-110 origin-left inline-block animate-in fade-in zoom-in duration-500">
          {value}
        </h3>
        <p className="text-sm font-bold text-foreground/80">{title}</p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        {description && <p className="text-[10px] italic text-muted-foreground mt-2">{description}</p>}
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

  return (
    <Card className="p-6 border-2 flex flex-col items-center justify-center text-center gap-3">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <path
            className="stroke-muted fill-none"
            strokeWidth="3"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={cn("fill-none transition-all duration-1000 ease-out", colors[color])}
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black">{percentage}%</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <p className="text-[10px] font-bold text-foreground/60">{subtitle}</p>
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
          {isTask ? <CheckSquare className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
        </div>
        <div>
          <h4 className={cn("font-bold text-base", status === 'Done' && "line-through opacity-50")}>{item.title || item.description}</h4>
          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {showDate && <span>{item.date}</span>}
            {showDate && <span>•</span>}
            <span>{item.time || 'No Time'}</span>
            <span>•</span>
            <span className="text-primary">{item.source || 'Manual'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 text-[9px] font-black uppercase px-2", statusColors[status])}>
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, onClick, color }: any) {
  const colors: any = {
    blue: "text-blue-600 border-blue-100 hover:bg-blue-50",
    emerald: "text-emerald-600 border-emerald-100 hover:bg-emerald-50",
    purple: "text-purple-600 border-purple-100 hover:bg-purple-50",
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all active:scale-95 text-center gap-3 bg-white",
        colors[color]
      )}
    >
      <div className="p-3 rounded-full bg-white shadow-sm border">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-black uppercase tracking-widest">{title}</span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-muted/10 opacity-60">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
