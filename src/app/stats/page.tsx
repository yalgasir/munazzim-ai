
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
import { Target, Award, Clock, Activity, Loader2 } from "lucide-react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const COLORS = ['#2963CC', '#52B2BF', '#F59E0B', '#EF4444'];

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
      
      onSnapshot(qTasks, (s) => setTasks(s.docs.map(d => d.data())));
      onSnapshot(qApps, (s) => {
        setAppointments(s.docs.map(d => d.data()));
        setLoading(false);
      });
    } else {
      const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
      const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
      setTasks(allTasks.filter((t: any) => t.userId === userId));
      setAppointments(allApps.filter((a: any) => a.userId === userId));
      setLoading(false);
    }
  }, [user]);

  if (loading || !mounted) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  // معالجة البيانات للرسوم البيانية
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const pendingCount = tasks.filter(t => !t.isCompleted).length;
  
  const pieData = [
    { name: "منجزة", value: completedCount },
    { name: "قيد الانتظار", value: pendingCount }
  ];

  const categoryCounts = appointments.reduce((acc: any, app: any) => {
    const type = app.type || "عام";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(categoryCounts).map(key => ({
    name: key,
    count: categoryCounts[key]
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-8" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-1">مركز تحليلات الأداء (TRL 8)</h1>
          <p className="text-muted-foreground">تحليل دقيق لبياناتك الحقيقية المسجلة في النظام.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Target />} label="إنجاز المهام" value={`${completedCount}/${tasks.length}`} color="primary" />
          <StatCard icon={<Activity />} label="فعالية المواعيد" value={appointments.length} color="accent" />
          <StatCard icon={<Clock />} label="المهام العالقة" value={pendingCount} color="destructive" />
          <StatCard icon={<Award />} label="مستوى الالتزام" value={tasks.length > 0 ? `${Math.round((completedCount/tasks.length)*100)}%` : "0%"} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">توزيع المواعيد حسب الفئة</CardTitle>
              <CardDescription>تحليل نوعية الأنشطة المسجلة في جدولك</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData.length > 0 ? barData : [{name: 'لا يوجد', count: 0}]}>
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
              <CardTitle className="text-lg">حالة المهام الحالية</CardTitle>
              <CardDescription>نسبة الإنجاز مقابل المهام المتبقية</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasks.length > 0 ? pieData : [{name: 'لا توجد بيانات', value: 1}]}
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
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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

