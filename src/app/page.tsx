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
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [highPriorityTasksCount, setHighPriorityTasksCount] = useState(0);
  const [todayApps, setTodayApps] = useState<any[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);

  useEffect(() => {
    const loadData = () => {
      const savedAppointments = JSON.parse(localStorage.getItem('munazzim_appointments') || '[]');
      const savedTasks = JSON.parse(localStorage.getItem('munazzim_tasks') || '[]');
      
      setAppointmentsCount(savedAppointments.length);
      setTodayApps(savedAppointments.slice(0, 3));
      
      const pendingTasks = savedTasks.filter((t: any) => !t.isCompleted);
      setTotalTasksCount(pendingTasks.length);
      
      const highPriority = savedTasks.filter((t: any) => t.priority === "High" && !t.isCompleted);
      setHighPriorityTasksCount(highPriority.length);
      setUrgentTasks(highPriority.slice(0, 3));
    };

    loadData();
    
    // الاستماع لأي تغييرات في التخزين من نوافذ أخرى
    window.addEventListener('storage', loadData);
    // تحديث دوري كل ثانيتين للتأكد من المزامنة
    const interval = setInterval(loadData, 2000);
    
    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-primary">مرحباً بك مجدداً!</h1>
            <p className="text-muted-foreground">إليك نظرة سريعة على يومك وما ينتظرك.</p>
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
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <CalendarIcon className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-medium">مواعيد اليوم</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold mb-1">{appointmentsCount}</div>
              <p className="text-primary-foreground/80 text-sm">لديك {appointmentsCount} مواعيد مجدولة</p>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground shadow-lg border-none overflow-hidden relative group transition-all hover:scale-[1.02]">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-medium">المهام القائمة</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold mb-1">{totalTasksCount}</div>
              <p className="text-accent-foreground/80 text-sm">إجمالي المهام التي تنتظر الإنجاز</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg overflow-hidden relative group transition-all hover:scale-[1.02] border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                تنبيهات هامة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{highPriorityTasksCount}</div>
              <p className="text-muted-foreground text-sm">مهام عالية الأولوية قاربت على الانتهاء</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl text-right">جدول مواعيدك</CardTitle>
                <CardDescription className="text-right">المواعيد القريبة المجدولة</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/appointments" className="gap-2">
                  عرض الكل
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayApps.length > 0 ? todayApps.map((app) => (
                <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-primary/5 hover:bg-primary/5 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="font-bold text-lg">{app.title}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground justify-end">
                      <span>{app.time}</span>
                      <span>•</span>
                      <span>{app.date}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary/20">{app.type}</Badge>
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground">لا توجد مواعيد مضافة بعد.</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl text-right">المهام العاجلة</CardTitle>
                <CardDescription className="text-right">ركز على الأولويات القصوى أولاً</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks" className="gap-2">
                  إدارة المهام
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentTasks.length > 0 ? urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border border-primary/5 hover:bg-primary/5 transition-colors">
                  <div className="flex-1 text-right">
                    <h4 className="font-bold mb-1">{task.description}</h4>
                    <span className="text-sm text-muted-foreground">الأولوية: {task.priority === "High" ? "عالية" : "متوسطة"}</span>
                  </div>
                  <Badge className={cn(
                    "text-white",
                    task.priority === "High" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                  )}>
                    عاجلة
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground">لا توجد مهام عالية الأولوية حالياً.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}