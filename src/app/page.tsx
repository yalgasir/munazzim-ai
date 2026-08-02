
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
  MoreVertical,
  CalendarDays,
  Target,
  AlertCircle,
  Loader2,
  CalendarPlus,
  Zap,
  TrendingUp
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
  const pendingTasks = totalTasks - doneTasks;
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalApps = appointments.length;
  const attendedApps = appointments.filter(a => a.attendanceStatus === 'Attended').length;
  const upcomingApps = totalApps - attendedApps;
  const attendanceRate = totalApps > 0 ? Math.round((attendedApps / totalApps) * 100) : 0;

  const productivityScore = Math.round((taskCompletionRate + attendanceRate) / 2);
  const totalItemsCount = totalTasks + totalApps;

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
      <div className="flex flex-col gap-8 max-w-full mx-auto" dir="ltr">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Organize your tasks, appointments, and daily priorities in one place.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{headerDate}</p>
          </div>
        </div>

        {/* Row 1: Unified Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Total Items" 
            value={totalItemsCount} 
            subtitle="Tasks + Appointments"
            icon={<Activity className="h-4 w-4" />} 
            color="blue"
            href="/stats"
          />
          <StatCard 
            title="Tasks" 
            value={totalTasks} 
            subtitle={`${taskCompletionRate}% Completed`}
            details={`${doneTasks} Done • ${pendingTasks} Pending`}
            icon={<CheckSquare className="h-4 w-4" />} 
            color="emerald"
            href="/tasks"
          />
          <StatCard 
            title="Appointments" 
            value={totalApps} 
            subtitle={`${attendanceRate}% Attended`}
            details={`${attendedApps} Attended • ${upcomingApps} Upcoming`}
            icon={<CalendarIcon className="h-4 w-4" />} 
            color="purple"
            href="/appointments"
          />
        </div>

        {/* Quick Creation Row */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Quick Creation</h2>
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
          
          {/* Left Column */}
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" /> Today's Schedule
                </h2>
              </div>
              <div className="space-y-0">
                {todayActivities.length > 0 ? (
                  <div className="relative">
                    {todayActivities.map((item, index) => (
                      <TimelineActivityRow 
                        key={item.id} 
                        item={item} 
                        onStatusUpdate={item.type === 'task' ? updateTaskStatus : updateAppStatus}
                        isLast={index === todayActivities.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No activities scheduled for today." />
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" /> Upcoming Activities
                </h2>
                <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-primary hover:bg-transparent">
                  <Link href="/calendar">View Full Calendar <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="space-y-0">
                {upcomingActivities.length > 0 ? (
                  <div className="relative">
                    {upcomingActivities.slice(0, 5).map((item, index) => (
                      <TimelineActivityRow 
                        key={item.id} 
                        item={item} 
                        showDate
                        onStatusUpdate={item.type === 'task' ? updateTaskStatus : updateAppStatus}
                        isLast={index === upcomingActivities.slice(0, 5).length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No upcoming activities found." />
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8 sticky top-24">
            <ScheduleAnalysisWidget appointments={appointments} tasks={tasks} />
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Workspace Intelligence</h3>
              <CircularStatCard 
                title="Overall Performance" 
                percentage={productivityScore} 
                subtitle={productivityScore > 80 ? "Excellent" : "Operational"}
                color="primary"
                size="lg"
              />
            </div>
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

function StatCard({ title, value, subtitle, details, icon, color, href }: any) {
  const isClickable = !!href;
  const colors: any = {
    blue: "text-blue-600 border-blue-100 hover:bg-blue-50/50",
    emerald: "text-emerald-600 border-emerald-100 hover:bg-emerald-50/50",
    purple: "text-purple-600 border-purple-100 hover:bg-purple-50/50",
  };

  const content = (
    <Card className={cn(
      "p-4 border-2 transition-all duration-300 group shadow-sm flex flex-col justify-between h-32",
      colors[color] || "bg-card",
      isClickable ? "hover:scale-[1.02] hover:shadow-md cursor-pointer" : "cursor-default"
    )}>
      <div className="flex justify-between items-start">
        <div className="p-1.5 rounded-lg bg-white shadow-sm border border-inherit">
          {icon}
        </div>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-xl font-black text-foreground">{value}</h3>
        <p className="text-[10px] font-black text-foreground/80 uppercase tracking-tight">{title}</p>
        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        {details && <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest">{details}</p>}
      </div>
    </Card>
  );

  return isClickable ? <Link href={href} className="focus:outline-none">{content}</Link> : content;
}

function CircularStatCard({ title, percentage, subtitle, color, size = "md", href }: any) {
  const colors: any = {
    emerald: "text-emerald-600 stroke-emerald-500",
    primary: "text-primary stroke-primary",
  };

  const safePercentage = Math.min(100, Math.max(0, percentage || 0));
  const circleSize = size === "lg" ? "h-20 w-20" : "h-12 w-12";
  const strokeWidth = size === "lg" ? "3" : "4";

  const content = (
    <Card className={cn(
      "p-4 border-2 flex flex-col items-center justify-center text-center gap-3 shadow-sm group transition-all h-32",
      href ? "hover:border-primary/40 hover:scale-[1.02] cursor-pointer" : ""
    )}>
      <div className={cn("relative", circleSize)}>
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <path
            className="stroke-muted fill-none"
            strokeWidth={strokeWidth}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={cn("fill-none transition-all duration-1000 ease-out", colors[color])}
            strokeWidth={strokeWidth}
            strokeDasharray={`${safePercentage}, 100`}
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-black", size === "lg" ? "text-sm" : "text-[10px]")}>{safePercentage}%</span>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
        {subtitle && <p className="text-[8px] font-bold text-foreground/70">{subtitle}</p>}
      </div>
    </Card>
  );

  return href ? <Link href={href} className="focus:outline-none">{content}</Link> : content;
}

function TimelineActivityRow({ item, onStatusUpdate, isLast, showDate = false }: any) {
  const isTask = item.type === 'task';
  const isAI = item.source === 'ai_generated';
  const status = isTask ? item.status || (item.isCompleted ? 'Done' : 'Pending') : item.attendanceStatus || 'Upcoming';

  const dotColor = isAI ? 'bg-purple-500' : (isTask ? 'bg-emerald-500' : 'bg-blue-500');
  const typeLabel = isTask ? 'TASK' : 'APPOINTMENT';
  const typeLabelColor = isAI ? 'text-purple-500' : (isTask ? 'text-emerald-500' : 'text-blue-500');

  const statusColors: any = {
    'Pending': 'bg-orange-100 text-orange-700 border-orange-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Done': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Upcoming': 'bg-purple-100 text-purple-700 border-purple-200',
    'Attended': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Missed': 'bg-red-100 text-red-700 border-red-200',
  };
  
  const getDuration = () => {
    if (!item.startTime || !item.endTime) return null;
    try {
      const start = new Date(`1970-01-01T${item.startTime}Z`);
      const end = new Date(`1970-01-01T${item.endTime}Z`);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
      if (diff < 0) return null;
      if (diff >= 60) {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
      }
      return `${diff}m`;
    } catch(e) {
      return null;
    }
  };
  const duration = getDuration();

  return (
    <div className="flex items-start gap-4 group">
      <div className="w-20 text-right font-bold text-xs text-muted-foreground pt-1.5 shrink-0">
        {showDate 
          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
          : (item.time || 'No Time')}
      </div>
      <div className="relative flex flex-col items-center">
        <div className={cn("w-3 h-3 rounded-full mt-1.5 z-10 border-2 border-white", dotColor)}></div>
        {!isLast && <div className="absolute top-5 -bottom-2 w-0.5 bg-muted/50"></div>}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div className={cn("space-y-1 group-hover:bg-muted/30 p-3 rounded-lg transition-colors w-full", status === 'Done' && "opacity-60")}>
            <p className={cn("text-[9px] font-bold uppercase tracking-wider", typeLabelColor)}>{typeLabel}</p>
            <h4 className={cn("font-bold text-sm text-foreground", status === 'Done' && "line-through")}>
              {item.title || item.description}
            </h4>
            <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
              {showDate && <span>{item.time || 'No Time'}</span>}
              {!showDate && duration && <span>{duration}</span>}
              {!showDate && item.location && <span>{item.location}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-3 pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-5 text-[7px] font-black uppercase px-2 rounded-lg", statusColors[status] || "bg-muted text-muted-foreground")}>
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
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
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
        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 text-center gap-2 bg-white shadow-sm",
        colors[color]
      )}
    >
      <div className="p-1.5 rounded-full bg-white shadow-sm border border-inherit">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{title}</span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center gap-2 bg-muted/10 opacity-60">
      <AlertCircle className="h-4 w-4 text-muted-foreground" />
      <p className="text-[10px] font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
