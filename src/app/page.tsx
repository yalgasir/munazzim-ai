
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

    if (isFirebaseConfigured) {
      const qApps = query(collection(db, "appointments"), where("userId", "==", user.uid));
      const qTasks = query(collection(db, "tasks"), where("userId", "==", user.uid));

      const unsubApps = onSnapshot(qApps, (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const unsubTasks = onSnapshot(qTasks, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => { unsubApps(); unsubTasks(); };
    } else {
      // محاكاة البيانات من LocalStorage لكل مستخدم بشكل منفصل
      const userId = user.id || user.uid;
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

  const totalPendingTasks = tasks.filter(t => !t.isCompleted).length;
  const highPriorityTasks = tasks.filter(t => t.priority === "High" && !t.isCompleted);

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-primary flex items-center gap-2">
              مرحباً بك {user?.email?.split('@')[0]}!
              {isDemo && <Badge variant="outline" className="text-[10px] bg-amber-50">حساب محلي</Badge>}
            </h1>
            <p className="text-muted-foreground">إليك نظرة سريعة على عالمك الخاص في منظّم.</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 bg-primary hover:bg-primary/90" asChild>
              <Link href="/appointments">
                <Plus className="h-4 w-4" />
                موعد جديد
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-medium">مواعيدي</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold mb-1">{appointments.length}</div>
              <p className="text-primary-foreground/80 text-sm">لديك {appointments.length} موعد خاص بك</p>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground shadow-lg border-none overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-medium">المهام المتبقية</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold mb-1">{totalPendingTasks}</div>
              <p className="text-accent-foreground/80 text-sm">مهام بانتظارك</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg overflow-hidden relative group transition-all hover:scale-[1.02] border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                عاجل جداً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{highPriorityTasks.length}</div>
              <p className="text-muted-foreground text-sm">أولويات قصوى تتطلب انتباهك</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl text-right">جدولي الزمني</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/appointments" className="gap-2">
                  إدارة الكل <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments.length > 0 ? appointments.slice(0, 3).map((app, idx) => (
                <div key={app.id || idx} className="flex items-center gap-4 p-4 rounded-xl border border-primary/5">
                  <div className="flex-1 text-right">
                    <h4 className="font-bold">{app.title}</h4>
                    <span className="text-xs text-muted-foreground">{app.date} • {app.time}</span>
                  </div>
                </div>
              )) : <p className="text-center text-muted-foreground py-10">لا يوجد مواعيد في عالمك الخاص.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl text-right">المهام العاجلة</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks" className="gap-2">
                  إدارة المهام <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {highPriorityTasks.length > 0 ? highPriorityTasks.slice(0, 3).map((task, idx) => (
                <div key={task.id || idx} className="flex items-center gap-4 p-4 rounded-xl border border-primary/5">
                  <div className="flex-1 text-right">
                    <h4 className="font-bold">{task.description}</h4>
                  </div>
                  <Badge className="bg-red-500">عاجل</Badge>
                </div>
              )) : <p className="text-center text-muted-foreground py-10">عالمك منظم ولا توجد مهام عاجلة!</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
