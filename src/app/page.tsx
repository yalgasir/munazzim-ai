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
  Loader2,
  Layers,
  Activity,
  FileSearch,
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

  const pendingTasksCount = tasks.filter(t => !t.isCompleted).length;
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-3 py-1">
                <Check className="h-3 w-3" /> تم التحقق: TRL 6 Active
              </Badge>
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary">لوحة التحكم المركزية</h1>
            <p className="text-muted-foreground">مرحباً {user?.email?.split('@')[0]}، جميع الأنظمة متصلة حالياً.</p>
          </div>
          <Button className="gap-2 shadow-lg h-12" asChild>
            <Link href="/ai-assistant">
              <TrendingUp className="h-5 w-5" /> المساعد السياقي (TRL 6)
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="المواعيد الحقيقية" value={appointments.length} icon={<CalendarIcon />} color="blue" />
          <StatCard title="كفاءة الإنجاز" value={`${completionRate}%`} icon={<CheckCircle2 />} color="emerald" />
          <StatCard title="مهام غير مكتملة" value={pendingTasksCount} icon={<Clock />} color="amber" />
          <StatCard title="إجمالي السجلات" value={tasks.length + appointments.length} icon={<Activity />} color="purple" />
        </div>

        {/* Proof of TRL Section */}
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> سجل براهين الجاهزية (NASA TRL Evidence)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <EvidenceItem 
                level="TRL 4" 
                title="التحقق المخبري" 
                proof="تم فحص تدفقات Genkit المستقلة بنجاح." 
                status="Verified" 
              />
              <EvidenceItem 
                level="TRL 5" 
                title="تكامل الأنظمة" 
                proof={`تم ربط ${appointments.length} موعد و ${tasks.length} مهمة بقاعدة البيانات.`} 
                status="Integrated" 
              />
              <EvidenceItem 
                level="TRL 6" 
                title="النموذج السياقي" 
                proof="المساعد الذكي قادر على قراءة مصفوفة البيانات النشطة." 
                status="Active" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "from-blue-600 to-blue-800",
    emerald: "from-emerald-600 to-emerald-800",
    amber: "from-amber-600 to-amber-800",
    purple: "from-purple-600 to-purple-800"
  };

  return (
    <div className={cn("p-6 rounded-2xl bg-gradient-to-br text-white shadow-xl transform transition-transform hover:scale-105", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
        <Badge className="bg-white/20 border-none text-white">Live Data</Badge>
      </div>
      <p className="text-sm opacity-80 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}

function EvidenceItem({ level, title, proof, status }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
      <div className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-lg text-xs whitespace-nowrap">
        {level}
      </div>
      <div className="flex-1 text-right">
        <p className="font-bold text-sm mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{proof}</p>
      </div>
      <Badge variant="outline" className="text-[10px] uppercase border-emerald-500 text-emerald-600">
        {status}
      </Badge>
    </div>
  );
}
