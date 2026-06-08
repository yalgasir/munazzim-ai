"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, BrainCircuit, Lightbulb, Loader2, AlertTriangle, Database, Zap } from "lucide-react";
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
  const [dataStatus, setDataStatus] = useState<"idle" | "fetching" | "ready">("idle");
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptimize = async () => {
    if (!user) return;
    setLoading(true);
    setDataStatus("fetching");
    setSuggestion(null);

    try {
      const userId = user.uid || user.id;
      let currentAppointments: any[] = [];
      let currentTasks: any[] = [];

      // TRL 6: سحب البيانات الحقيقية من النظام لتمريرها للذكاء الاصطناعي
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

      setDataStatus("ready");

      // استدعاء التدفق الذكي مع السياق الكامل (TRL 6)
      const result = await optimizeSchedule({
        currentAppointments,
        currentTasks,
        productivityContext: context,
      });

      setSuggestion(result);
      toast({
        title: "اكتمل التحليل (TRL 6)",
        description: "قام منظّم بتحليل جدولك وتقديم توصيات سياقية.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "خطأ في التحليل",
        description: error.message || "تعذر الوصول إلى المساعد الذكي.",
      });
    } finally {
      setLoading(false);
      setDataStatus("idle");
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8" dir="rtl">
        <div className="flex flex-col items-center text-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">
            <Zap className="h-3 w-3 ml-1" /> حالة النظام: TRL 6 (نموذج أولي متكامل)
          </Badge>
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <BrainCircuit className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">المساعد السياقي الذكي</h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            في هذا المستوى (TRL 6)، يقوم المساعد بقراءة مواعيدك ومهامك الفعلية ليقدم لك نصائح دقيقة ومبنية على واقعك.
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-primary text-lg">
              <Sparkles className="h-5 w-5" />
              بماذا أفكر اليوم؟
            </CardTitle>
            {dataStatus === "fetching" && (
              <Badge variant="secondary" className="animate-pulse gap-1">
                <Database className="h-3 w-3" /> جاري قراءة بياناتك...
              </Badge>
            )}
          </div>
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="مثال: هل لدي وقت اليوم لممارسة الرياضة؟ أو هل هناك تعارضات في جديولي؟"
              className="min-h-[120px] text-lg p-4 resize-none focus:ring-primary/50 text-right"
              dir="rtl"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <Button 
              className="w-full h-14 text-xl font-bold gap-3 shadow-lg transition-all hover:scale-[1.01] active:scale-95" 
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
              {loading ? "جاري التحليل السياقي..." : "تحليل الجدول والمهام"}
            </Button>
          </CardContent>
        </Card>

        {suggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
            <Card className="border-primary/30 bg-primary/5 border-l-4 border-l-primary shadow-md">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-xl">
                  <Lightbulb className="h-6 w-6" />
                  رؤية منظّم المقترحة (TRL 6)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="leading-relaxed text-lg whitespace-pre-wrap font-medium text-right" dir="rtl">
                  {suggestion.summaryAnalysis}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestion.conflictsDetected && suggestion.conflictsDetected.length > 0 ? (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5" />
                      تعارضات تم رصدها
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-right" dir="rtl">
                    {suggestion.conflictsDetected.map((c, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border border-destructive/20 shadow-sm">
                        <p className="font-bold text-sm text-destructive mb-1">{c.appointment1} ضد {c.appointment2}</p>
                        <p className="text-sm text-muted-foreground mb-2">{c.reason}</p>
                        <p className="text-sm font-semibold text-primary">💡 {c.suggestion}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="text-emerald-600 flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5" />
                      سلامة الجدول
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-emerald-700">
                    تم فحص كافة المواعيد والمهام المسجلة، ولا توجد تعارضات وقتية مباشرة حالياً.
                  </CardContent>
                </Card>
              )}

              {suggestion.personalizedSuggestions && suggestion.personalizedSuggestions.length > 0 && (
                <Card className="md:col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-right">نصائح مخصصة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-right" dir="rtl">
                      {suggestion.personalizedSuggestions.map((s, idx) => (
                        <li key={idx} className="flex gap-2 items-start p-2 rounded-lg bg-muted/30 border text-sm">
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                          <p className="text-muted-foreground leading-relaxed">{s}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}