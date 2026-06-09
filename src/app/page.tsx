
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
  TrendingUp,
  Loader2,
  Activity,
  Plus,
  ArrowRight,
  Check
} from "lucide-react";
import Link from "next/link";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
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
      const loadLocalData = () => {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        setAppointments(allApps.filter((a: any) => a.userId === userId));
        setTasks(allTasks.filter((t: any) => t.userId === userId));
        setLoading(false);
      };
      loadLocalData();
      window.addEventListener('storage', loadLocalData);
      return () => window.removeEventListener('storage', loadLocalData);
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
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary mb-1">مرحباً بك في منظّم</h1>
            <p className="text-muted-foreground">لديك {pendingTasks.length} مهام معلقة اليوم.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/tasks">
                <Plus className="h-4 w-4" /> مهمة جديدة
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/appointments">
                <CalendarIcon className="h-4 w-4" /> موعد جديد
              </Link>
            </Button>
            <Button className="gap-2 shadow-lg" asChild>
              <Link href="/ai-assistant">
                <TrendingUp className="h-4 w-4" /> تحليل الجدول بالذكاء الاصطناعي
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المهام" value={tasks.length} icon={<Activity />} color="blue" />
          <StatCard title="كفاءة الإنجاز" value={`${completionRate}%`} icon={<CheckCircle2 />} color="emerald" />
          <StatCard title="المواعيد القادمة" value={appointments.length} icon={<CalendarIcon />} color="purple" />
          <StatCard title="مهام معلقة" value={pendingTasks.length} icon={<Clock />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">آخر المهام</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks" className="gap-1">عرض الكل <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      task.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground"
                    )}>
                      {task.isCompleted && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={cn("font-medium", task.isCompleted && "line-through text-muted-foreground")}>
                      {task.description}
                    </span>
                  </div>
                  <Badge variant="outline">{task.priority === 'High' ? 'عالية' : 'عادية'}</Badge>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">لا توجد مهام مضافة بعد.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-inner">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" /> لمحة ذكية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>بناءً على نشاطك الأخير، نلاحظ تحسناً في معدل إنجاز المهام الصباحية بنسبة 15%.</p>
              <div className="p-3 bg-white rounded-lg border border-primary/10">
                <p className="font-bold text-primary mb-1 text-xs">نصيحة اليوم:</p>
                <p className="text-xs">حاول جدولة المواعيد التي تتطلب تركيزاً عالياً قبل الساعة 11 صباحاً.</p>
              </div>
              <Button className="w-full mt-2" size="sm" asChild>
                <Link href="/ai-assistant">استشر منظّم الذكي</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "from-blue-600 to-blue-700 bg-blue-600",
    emerald: "from-emerald-600 to-emerald-700 bg-emerald-600",
    amber: "from-amber-600 to-amber-700 bg-amber-600",
    purple: "from-purple-600 to-purple-700 bg-purple-600"
  };

  return (
    <div className={cn("p-6 rounded-2xl bg-gradient-to-br text-white shadow-md hover:shadow-lg transition-all", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
      <p className="text-sm opacity-90 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}
