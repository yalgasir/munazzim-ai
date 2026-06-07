"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, BrainCircuit, Lightbulb, Loader2, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { OptimizeScheduleOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistantPage() {
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<OptimizeScheduleOutput | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptimize = async () => {
    if (!context.trim()) {
      toast({
        variant: "destructive",
        title: "تنبيه",
        description: "يرجى إدخال تفاصيل أو سياق ليتمكن منظّم من مساعدتك.",
      });
      return;
    }

    setLoading(true);
    setSuggestion(null); // مسح الاقتراح السابق لبدء تحميل جديد

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: context,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في الاتصال بالمساعد');
      }
      
      const result = await response.json();
      
      // معالجة الرد لضمان التوافق مع واجهة المستخدم
      if (result.reply) {
        setSuggestion({
          summaryAnalysis: typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply),
          personalizedSuggestions: [],
          conflictsDetected: [],
          priorityAdjustments: []
        });
        
        toast({
          title: "تم التحليل",
          description: "تلقيت نصيحة جديدة من منظّم.",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: error.message || "تعذر الوصول إلى مساعد الذكاء الاصطناعي حالياً.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <BrainCircuit className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">منظّم الذكي</h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            مساعدك الشخصي لإدارة الوقت والإنتاجية. اسأل عن ترتيب يومك أو حل تعارضاتك.
          </p>
        </div>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-primary/5 p-4 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary text-lg">
              <Sparkles className="h-5 w-5" />
              أنا أسمعك.. كيف أرتب يومك؟
            </CardTitle>
          </div>
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="مثال: لدي اجتماع في الساعة 10 صباحاً وموعد طبيب في 10:30، كيف أتصرف؟"
              className="min-h-[120px] text-lg p-4 resize-none focus:ring-primary/50 text-right"
              dir="rtl"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleOptimize();
                }
              }}
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
              {loading ? "جاري التفكير..." : "تحليل وتحسين الجدول"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">نصيحة: اضغط Ctrl + Enter للإرسال السريع</p>
          </CardContent>
        </Card>

        {suggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-6">
            <Card className="border-primary/30 bg-primary/5 border-l-4 border-l-primary shadow-md">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-xl">
                  <Lightbulb className="h-6 w-6" />
                  رؤية منظّم المقترحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="leading-relaxed text-lg whitespace-pre-wrap font-medium text-right" dir="rtl">
                  {suggestion.summaryAnalysis}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestion.conflictsDetected && suggestion.conflictsDetected.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5" />
                      تنبيه: تعارضات محتملة
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
              )}

              {suggestion.personalizedSuggestions && suggestion.personalizedSuggestions.length > 0 && (
                <Card className="md:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-right">خطوات إضافية لتعزيز إنتاجيتك</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" dir="rtl">
                      {suggestion.personalizedSuggestions.map((s, idx) => (
                        <li key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
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
