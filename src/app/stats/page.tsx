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
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Target, Award, Activity, Loader2, ShieldCheck, Cpu } from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#2963CC', '#52B2BF', '#F59E0B', '#EF4444'];

export default function StatsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setFormattedDate(`${day}/${month}/${year}`);
    
    if (!user) return;
    const userId = user.uid || user.id;

    if (isFirebaseConfigured) {
      const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
      const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
      
      const unsubTasks = onSnapshot(qTasks, (s) => setTasks(s.docs.map(d => d.data())));
      const unsubApps = onSnapshot(qApps, (s) => {
        setAppointments(s.docs.map(d => d.data()));
        setLoading(false);
      });
      
      return () => {
        unsubTasks();
        unsubApps();
      };
    } else {
      const loadLocalData = () => {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        setTasks(allTasks.filter((t: any) => t.userId === userId));
        setAppointments(allApps.filter((a: any) => a.userId === userId));
        setLoading(false);
      };
      loadLocalData();
      window.addEventListener('storage', loadLocalData);
      return () => window.removeEventListener('storage', loadLocalData);
    }
  }, [user]);

  if (loading || !mounted) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  const completedCount = (tasks || []).filter(t => t.isCompleted).length;
  const totalTasks = (tasks || []).length;
  const pendingCount = totalTasks - completedCount;

  const attendedCount = (appointments || []).filter(t => t.attendanceStatus === 'Attended').length;
  const totalAppointments = (appointments || []).length;
  
  const pieData = totalTasks > 0 ? [
    { name: "Completed", value: completedCount },
    { name: "Pending", value: pendingCount }
  ] : [{ name: "No Tasks", value: 1 }];

  const categoryCounts = (tasks || []).reduce((acc: any, task: any) => {
    const category = task.priority || "General";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(categoryCounts).length > 0 
    ? Object.keys(categoryCounts).map(key => ({
        name: key,
        count: categoryCounts[key]
      }))
    : [{ name: 'None', count: 0 }];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8" dir="ltr">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline mb-1">Performance Analytics</h1>
            <p className="text-muted-foreground">Precise monitoring of Key Performance Indicators (KPIs) and system health.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Target />} label="Task Completion" value={`${completedCount}/${totalTasks}`} color="primary" />
          <StatCard icon={<Activity />} label="Appointments" value={`${attendedCount}/${totalAppointments}`} color="accent" />
          <StatCard icon={<Award />} label="Commitment" value={totalTasks > 0 ? `${Math.round((completedCount/totalTasks)*100)}%` : "0%"} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tasks by Category</CardTitle>
              <CardDescription>Analysis of task distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Readiness Status</CardTitle>
              <CardDescription>Final completion efficiency</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorMap: any = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20"
  };

  return (
    <Card className={`p-4 flex items-center gap-4 border ${colorMap[color]}`}>
      <div className="h-12 w-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
