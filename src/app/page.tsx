
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Dashboard() {
  const { user, loading: authLoading, isDemo } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userId = user.uid || user.id;

    if (isFirebaseConfigured) {
      const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
      const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));

      const unsubApps = onSnapshot(qApps, (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const unsubTasks = onSnapshot(qTasks, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => { unsubApps(); unsubTasks(); };
    } else {
      const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
      const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
      setAppointments(allApps.filter((a: any) => a.userId === userId));
      setTasks(allTasks.filter((t: any) => t.userId === userId));
      setLoading(false);
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
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const highPriorityCount = pendingTasks.filter(t => t.priority === "High").length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-primary">
              لوحة التحكم الاحترافية (TRL 8)
            </h1>
            <p className="text-muted-foreground">مرحباً {user?.email?.split('@')[0]}، إليك تحليل شامل لأدائك اليوم.</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 shadow-lg" asChild>
              <Link href="/ai-assistant">
                <TrendingUp className="h-4 w-4" />
                تحسين الجدول بالذكاء الاصطناعي
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-primary to-blue-700 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي المواعيد</p>
                  <h3 className="text-3xl font-bold mt-1">{appointments.length}</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg"><CalendarIcon className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-50 text-sm font-medium">معدل الإنجاز</p>
                  <h3 className="text-3xl font-bold mt-1">{completionRate}%</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-50 text-sm font-medium">مهام معلقة</p>
                  <h3 className="text-3xl font-bold mt-1">{pendingTasks.length}</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg"><Clock className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-rose-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-rose-50 text-sm font-medium">أولويات قصوى</p>
                  <h3 className="text-3xl font-bold mt-1">{highPriorityCount}</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold">أحدث المواعيد</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/appointments">عرض الكل</Link></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments.length > 0 ? appointments.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                  <div className="text-right">
                    <p className="font-bold text-sm">{app.title}</p>
                    <p className="text-xs text-muted-foreground">{app.date} | {app.time || "بدون وقت"}</p>
                  </div>
                  <Badge variant="outline" className="bg-white">{app.type || "عام"}</Badge>
                </div>
              )) : <div className="text-center py-10 text-muted-foreground">لا توجد مواعيد مضافة حالياً.</div>}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold">المهام العاجلة</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/tasks">إدارة المهام</Link></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingTasks.filter(t => t.priority === "High").length > 0 ? pendingTasks.filter(t => t.priority === "High").slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border-r-4 border-r-rose-500 bg-rose-50/30">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  <p className="font-medium text-sm text-right flex-1">{task.description}</p>
                </div>
              )) : <div className="text-center py-10 text-muted-foreground">عالمك منظم تماماً! لا توجد مهام عاجلة.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
