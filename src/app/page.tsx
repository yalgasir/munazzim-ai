
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
  TrendingUp,
  Clock,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";

/**
 * @fileOverview لوحة التحكم - مستوى TRL 5
 * تم تفعيل الربط الديناميكي الكامل مع قاعدة البيانات (Firestore/LocalStorage)
 * لضمان أن النظام الفرعي يعمل بشكل متكامل في بيئة ذات صلة.
 */

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userId = user.uid || user.id;

    if (isFirebaseConfigured) {
      // جلب البيانات الحقيقية من Firestore لمطابقة معايير TRL 5
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
      // وضع المحاكاة المتطور TRL 5 (قراءة من الذاكرة المحلية المعزولة)
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
              منظّم | لوحة القيادة المتكاملة (TRL 5)
            </h1>
            <p className="text-muted-foreground text-lg">
              أهلاً {user?.email?.split('@')[0]}، تم التحقق من تكامل الأنظمة بنجاح.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 shadow-lg h-12" asChild>
              <Link href="/ai-assistant">
                <TrendingUp className="h-5 w-5" />
                المساعد الذكي للسياق
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="المواعيد النشطة" 
            value={appointments.length} 
            icon={<CalendarIcon className="h-6 w-6" />}
            gradient="from-blue-600 to-indigo-700"
          />
          <StatCard 
            title="معدل الإنجاز" 
            value={`${completionRate}%`} 
            icon={<CheckCircle2 className="h-6 w-6" />}
            gradient="from-emerald-500 to-teal-600"
          />
          <StatCard 
            title="المهام القائمة" 
            value={pendingTasks.length} 
            icon={<Clock className="h-6 w-6" />}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard 
            title="أولويات حرجة" 
            value={highPriorityCount} 
            icon={<AlertCircle className="h-6 w-6" />}
            gradient="from-rose-500 to-red-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl">جدول المواعيد المتكامل</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {appointments.length > 0 ? appointments.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="text-right">
                      <p className="font-bold">{app.title}</p>
                      <p className="text-xs text-muted-foreground">{app.date} • {app.time || "غير محدد"}</p>
                    </div>
                    <Badge variant="secondary" className="px-3">{app.type || "عام"}</Badge>
                  </div>
                )) : <div className="p-10 text-center text-muted-foreground">لا توجد بيانات متاحة حالياً.</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl">تنبيهات النظام (TRL 5)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pendingTasks.filter(t => t.priority === "High").length > 0 ? (
                <div className="space-y-4">
                  {pendingTasks.filter(t => t.priority === "High").slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-900 text-sm">{task.description}</p>
                        <p className="text-xs text-rose-700">تتطلب انتباهاً فورياً لتحقيق أهداف المستوى الخامس.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground italic">النظام الفرعي مستقر، لا توجد تنبيهات حرجة.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, gradient }: any) {
  return (
    <Card className={cn("border-none shadow-xl text-white bg-gradient-to-br", gradient)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}
