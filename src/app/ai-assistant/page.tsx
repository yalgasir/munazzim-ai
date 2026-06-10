
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, BrainCircuit, Loader2, Check, Cpu, AlertCircle } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptimize = async () => {
    if (!user) return;
    if (!context.trim()) {
      toast({
        variant: "destructive",
        title: "تنبيه",
        description: "يرجى كتابة شيء للمساعد الذكي ليتمكن من مساعدتك.",
      });
      return;
    }

    setLoading(true);
    setSuggestion(null);

    try {
      const userId = user.uid || user.id;
      let currentAppointments: any[] = [];
      let currentTasks: any[] = [];

      try {
        if (isFirebaseConfigured) {
          const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
          const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
          const [appSnap, taskSnap] = await Promise.all([getDocs(qApps), getDocs(qTasks)]);
          
          currentAppointments = appSnap.docs.map(doc => ({
            title: doc.data().title || "موعد بدون عنوان",
            startTime: `${doc.data().date || new Date().toISOString().split('T')[0]}T${doc.data().time || "00:00"}:00Z`,
            endTime: `${doc.data().date || new Date().toISOString().split('T')[0]}T${doc.data().time || "01:00"}:00Z`,
          }));
          
          currentTasks = taskSnap.docs.map(doc => ({
            description: doc.data().description || "مهمة بدون وصف",
            priority: doc.data().priority || "Medium",
            isCompleted: !!doc.data().isCompleted,
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
      } catch (dbError) {
        console.error("Database fetch error:", dbError);
      }

      const result = await optimizeSchedule({
        currentAppointments,
        currentTasks,
        productivityContext: context,
      });

      if (result) {
        setSuggestion(result);
        toast({
          title: "تم التحليل",
          description: "قام المساعد بمراجعة طلبك وجدولك الحالي.",
        });
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      toast({ 
        variant: "destructive", 
        title: "خطأ في الاتصال", 
        description: "حدثت مشكلة أثناء الاتصال بمحرك الذكاء. يرجى التأكد من مفتاح OpenRouter." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8" dir="rtl">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm border border-primary/20">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">المساعد الذكي للإنتاجية</h1>
          <p className="text-muted-foreground max-w-xl">
            أنا أقرأ جدول مواعيدك ومهامك المعلقة لأقدم لك أفضل طريقة لتنظيم يومك وتجنب التعارضات.
          </p>
          <Badge variant="outline" className="mt-2 gap-1.5 py-1 px-3 border-primary/30 text-primary">
          <Cpu className="h-3.5 w-3.5" /> محرك الذكاء: Qwen3 30B via OpenRouter
          </Badge>
        </div>

        <Card className="border-primary/10 shadow-lg bg-card overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="بماذا يمكنني مساعدتك اليوم؟ (مثال: عندي موعدين اليوم 10 ص و 12 م رتب لي)"
              className="min-h-[140px] text-lg p-4 text-right border-primary/20 focus:ring-primary/30 transition-all"
              dir="rtl"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <Button 
              className="w-full h-14 text-xl font-bold gap-3 shadow-md active:scale-[0.98] transition-transform" 
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {loading ? "جاري الاتصال بـ OpenRouter..." : "ابدأ التحليل الذكي"}
            </Button>
          </CardContent>
        </Card>

        {suggestion && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md border-r-4 border-r-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-700 flex items-center gap-2 text-xl">
                  <Sparkles className="h-6 w-6" /> رد منظّم الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="leading-relaxed text-lg whitespace-pre-wrap font-medium text-right mb-6" dir="rtl">
                  {suggestion.summaryAnalysis}
                </div>
                
                {suggestion.personalizedSuggestions && suggestion.personalizedSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                      <Check className="h-5 w-5" /> توصيات مقترحة:
                    </h4>
                    <div className="grid gap-2">
                      {suggestion.personalizedSuggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <span className="text-foreground font-medium">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
