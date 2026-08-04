"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Target, Award, Activity, Loader2, Check, Calendar, TrendingUp } from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function StatsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) return;
    const userId = user.uid || user.id;

    if (isFirebaseConfigured) {
      const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
      const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
      
      const unsubTasks = onSnapshot(qTasks, (s) => setTasks(s.docs.map(d => ({...d.data(), id: d.id}))));
      const unsubApps = onSnapshot(qApps, (s) => {
        setAppointments(s.docs.map(d => ({...d.data(), id: d.id})));
        setLoading(false);
      });
      
      return () => { unsubTasks(); unsubApps(); };
    } else {
        setLoading(false);
    }
  }, [user]);

  if (loading || !mounted) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  const completedTasks = (tasks || []).filter(t => t.status === 'Done' || t.isCompleted).length;
  const pendingTasks = (tasks || []).length - completedTasks;

  const attendedApps = (appointments || []).filter(a => a.attendanceStatus === 'Attended').length;
  const upcomingApps = (appointments || []).length - attendedApps;

  const overviewData = [
    {
      name: 'Tasks',
      completed: completedTasks,
      pending: pendingTasks,
    },
    {
      name: 'Appointments',
      attended: attendedApps,
      upcoming: upcomingApps,
    },
  ];

  const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return weekNo;
  }

  const performanceData = [...tasks, ...appointments].reduce((acc: any, item: any) => {
      const date = new Date(item.createdAt || item.date);
      const week = `Week ${getWeekNumber(date)}`;
      if (!acc[week]) {
          acc[week] = { name: week, total: 0, completed: 0 };
      }
      acc[week].total++;
      if (item.isCompleted || item.status === 'Done' || item.attendanceStatus === 'Attended') {
          acc[week].completed++;
      }
      return acc;
  }, {});

  const weeklyPerformance = Object.values(performanceData).map((d: any) => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  })).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8" dir="ltr">
        <div className="text-left">
            <h1 className="text-3xl font-bold font-headline mb-1">Performance Analytics</h1>
            <p className="text-muted-foreground">Monitoring of Key Performance Indicators and productivity trends.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5"/> Tasks & Appointments Overview</CardTitle>
              <CardDescription>Comparative analysis of scheduled items.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip cursor={{fill: 'hsl(var(--muted) / 0.5)'}} />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed Tasks" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending Tasks" />
                  <Bar dataKey="attended" stackId="b" fill="#8b5cf6" name="Attended Appointments" />
                  <Bar dataKey="upcoming" stackId="b" fill="#d8b4fe" name="Upcoming Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Overall Performance</CardTitle>
              <CardDescription>Weekly productivity score over time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                        <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis unit="%" domain={[0, 100]} fontSize={12} axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Area type="monotone" dataKey="rate" name="Completion Rate" stroke="hsl(var(--primary))" fill="url(#colorRate)" strokeWidth={2}/>
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
