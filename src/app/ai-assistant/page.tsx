"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, BrainCircuit, Lightbulb, Loader2, AlertTriangle, Database, Zap, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, getDocs } from "firebase/firestore";
import { optimizeSchedule, OptimizeScheduleOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Badge } from "@/components/ui/badge";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<OptimizeScheduleOutput | null>(null);
  const [mounted, setMounted] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptimize = async () => {
    if (!user) return;
    setLoading(true);
    setSuggestion(null);

    try {
      const userId = user.uid || user.id;
      let currentAppointments: any[] = [];
      let currentTasks: any[] = [];

      if (isFirebaseConfigured) {
        const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
        const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
        const [appSnap, taskSnap] = await Promise.all([getDocs(qApps), getDocs(qTasks)]);
        currentAppointments = appSnap.docs.map(doc => ({
          title: doc.data().title,
          startTime: `${doc.data().date}T${doc.data().time || "00:00"}:00Z`,
          endTime: `${doc.data().date}T${doc.data().time || "01:00"}:00Z`,
        }));
        currentTasks = taskSnap.docs.map(doc => ({
          description: doc.data().description,
          priority: doc.data().priority,
          isCompleted: doc.data().isCompleted,
        }));
      } else {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        currentAppointments = allApps.filter((a: any) => a.userId === userId).map((a: any) => ({
          title: a.title,
          startTime: `${a.date}T${a.time || "00:00"}:00Z`,
          endTime: `${a.date}T${a.time || "01:00"}:00Z`,
        }));
        currentTasks = allTasks.filter((t: any) => t.userId === userId).map((t: any) => ({
          description: t.description,
          priority: t.priority,
          isCompleted: t.isCompleted,
        }));
      }

      // توثيق البيانات التي تم إرسالها للتحليل (دليل TRL 6)
      setAnalyzedData({ appointments: currentAppointments.length, tasks: currentTasks.length });

      const result = await optimizeSchedule({
        currentAppointments,
        currentTasks,
        productivityContext: context,
      });

      setSuggestion(result);
      toast({
        title: "اكتمل تحليل TRL 6",
        description: "قام المساعد بقراءة بياناتك الحقيقية بنجاح.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8" dir="rtl">
        <div className="flex flex-col items-center text-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">
            🚀 إثبات الكفاءة: TRL 6 (Contextual Integration)
          </Badge>
          <h1 className="text-3xl font-bold font-headline text-primary">المساعد الذكي الواعي بالسياق</h1>
          <p className="text-muted-foreground max-w-xl">
            الدليل القاطع للمستوى السادس: المساعد يقرأ مصفوفة بياناتك الحقيقية قبل توليد الرد.
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="بماذا يمكنني مساعدتك اليوم بناءً على جدولك؟"
              className="min-h-[120px] text-lg p-4 text-right"
              dir="rtl"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <Button 
              className="w-full h-14 text-xl font-bold gap-3" 
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
              {loading ? "جاري سحب وتحليل البيانات..." : "بدء التحليل السياقي (TRL 6)"}
            </Button>
          </CardContent>
        </Card>

        {analyzedData && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
            <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
              <span className="text-xs font-bold text-primary">مواعيد تم فحصها</span>
              <Badge variant="secondary">{analyzedData.appointments}</Badge>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg border flex items-center justify-between">
              <span className="text-xs font-bold text-primary">مهام تم تحليلها</span>
              <Badge variant="secondary">{analyzedData.tasks}</Badge>
            </div>
          </div>
        )}

        {suggestion && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2 text-xl">
                  <BrainCircuit className="h-6 w-6" /> برهان المستوى السادس (النتيجة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="leading-relaxed text-lg whitespace-pre-wrap font-medium text-right" dir="rtl">
                  {suggestion.summaryAnalysis}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
