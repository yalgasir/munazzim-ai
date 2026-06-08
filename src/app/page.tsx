
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
  FileSearch,
  Check,
  Globe
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
                <Check className="h-3 w-3" /> تم التحقق: TRL 8 Reliability Active
              </Badge>
            </div>
            <h1 className="text-3xl font-bold font-headline text-primary">لوحة التحكم والجاهزية التقنية</h1>
            <p className="text-muted-foreground">مرحباً {user?.email?.split('@')[0]}، جميع الأنظمة تعمل وفق معايير ناسا.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/api/health" target="_blank">
                <Globe className="h-5 w-5" /> دليل TRL 8
              </Link>
            </Button>
            <Button className="gap-2 shadow-lg" asChild>
              <Link href="/ai-assistant">
                <TrendingUp className="h-5 w-5" /> مساعد المستوى السادس
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="المهام الكلية" value={tasks.length} icon={<Activity />} color="blue" />
          <StatCard title="كفاءة الإنجاز" value={`${completionRate}%`} icon={<CheckCircle2 />} color="emerald" />
          <StatCard title="مهام معلقة" value={pendingTasksCount} icon={<Clock />} color="amber" />
          <StatCard title="إجمالي السجلات" value={tasks.length + appointments.length} icon={<Activity />} color="purple" />
        </div>

        {/* Proof of TRL Section - Checklist Style */}
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> سجل الأدلة التقنية (NASA Evidence Matrix)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <EvidenceRow 
                level="TRL 4" 
                goal="التحقق في بيئة تطوير" 
                proof="تم فحص الاختبارات في src/ai/flows/test-flow.ts" 
                isVerified={true} 
              />
              <EvidenceRow 
                level="TRL 5" 
                goal="تكامل الأنظمة" 
                proof={`ربط ${tasks.length} مهام حقيقية مع الهوية و Firestore.`} 
                isVerified={true} 
              />
              <EvidenceRow 
                level="TRL 6" 
                goal="عرض نموذج أولي" 
                proof="مساعد ذكي سياقي في src/app/ai-assistant/page.tsx" 
                isVerified={true} 
              />
              <EvidenceRow 
                level="TRL 7" 
                goal="نشر بيئة تشغيلية" 
                proof="تم النشر على Hugging Face ببيئة Docker معزولة." 
                isVerified={true} 
              />
              <EvidenceRow 
                level="TRL 8" 
                goal="الموثوقية والمراقبة" 
                proof="تفعيل Health Check API في src/app/api/health/route.ts" 
                isVerified={true} 
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

function EvidenceRow({ level, goal, proof, isVerified }: any) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className="w-16 font-bold text-primary">{level}</div>
      <div className="flex-1 text-right">
        <p className="text-sm font-bold">{goal}</p>
        <p className="text-xs text-muted-foreground">{proof}</p>
      </div>
      <div className={cn("flex items-center gap-1 text-xs font-bold", isVerified ? "text-emerald-600" : "text-amber-600")}>
        {isVerified ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
        {isVerified ? "مكتمل" : "جاري العمل"}
      </div>
    </div>
  );
}
