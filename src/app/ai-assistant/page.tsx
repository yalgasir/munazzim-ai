"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, BrainCircuit, Loader2, Check, Cpu, History, AlertTriangle, Calendar, Clock, LayoutList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, getDocs, addDoc, orderBy, limit, onSnapshot } from "firebase/firestore";
import { analyzeFullSchedule, AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AnalysisOutput | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!user || !db || !isFirebaseConfigured) return;

    const q = query(
      collection(db, "ai_logs"),
      where("userId", "==", user.uid || user.id),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleOptimize = async () => {
    if (!user) return;
    if (!context.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please describe your schedule or goals for the AI to analyze.",
      });
      return;
    }

    setLoading(true);

    try {
      const userId = user.uid || user.id;
      let currentAppointments: any[] = [];
      let currentTasks: any[] = [];

      if (isFirebaseConfigured && db) {
        const qApps = query(collection(db, "appointments"), where("userId", "==", userId));
        const qTasks = query(collection(db, "tasks"), where("userId", "==", userId));
        const [appSnap, taskSnap] = await Promise.all([getDocs(qApps), getDocs(qTasks)]);

        currentAppointments = appSnap.docs.map(doc => {
          const data = doc.data();
          return {
            title: String(data.title || "Untitled"),
            date: String(data.date || ""),
            time: String(data.time || ""),
          };
        });

        currentTasks = taskSnap.docs.map(doc => {
          const data = doc.data();
          return {
            description: String(data.description || "Untitled"),
            priority: String(data.priority || "Medium"),
            isCompleted: Boolean(data.isCompleted),
          };
        });
      }

      const result = await analyzeFullSchedule(currentAppointments, currentTasks, context);

      if (result) {
        setSuggestion(result);
        
        if (isFirebaseConfigured && db) {
          await addDoc(collection(db, "ai_logs"), {
            userId,
            prompt: context,
            analysis: result.todayOverview,
            recommendation: result.generalRecommendation,
            createdAt: new Date().toISOString(),
            model: "MythoMax-L2"
          });
        }

        toast({
          title: "Analysis Complete",
          description: "Your schedule has been analyzed by MythoMax-L2.",
        });
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the AI engine. Please check your OpenRouter API key.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!mounted) return "";
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8" dir="ltr">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm border border-primary/20">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">AI Productivity Assistant</h1>
          <p className="text-muted-foreground max-w-xl">
            Powered by MythoMax-L2. Get deep insights into your workload and schedule.
          </p>
          <Badge variant="outline" className="mt-2 gap-1.5 py-1 px-3 border-primary/30 text-primary">
            <Cpu className="h-3.5 w-3.5" /> Engine: MythoMax-L2 (Cloud)
          </Badge>
        </div>

        <Card className="border-primary/10 shadow-lg bg-card overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <Textarea
              placeholder="I'm running late for my next meeting, how should I adjust my day? / Help me prioritize my tasks for this week..."
              className="min-h-[120px] text-lg p-4 text-left border-primary/20 focus:ring-primary/30 transition-all"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <Button
              className="w-full h-14 text-xl font-bold gap-3 shadow-md transition-all active:scale-[0.98]"
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {loading ? "Analyzing..." : "Analyze Workspace Data"}
            </Button>
          </CardContent>
        </Card>

        {suggestion && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/20 shadow-xl overflow-hidden">
               <div className="bg-primary p-4 text-white">
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" /> AI Intelligence Report
                  </h3>
               </div>
              <CardContent className="p-6 space-y-8">
                <section>
                  <h4 className="font-bold text-primary flex items-center gap-2 mb-3 uppercase text-xs tracking-widest">
                    Today's Overview
                  </h4>
                  <p className="text-base leading-relaxed text-foreground/90">{suggestion.todayOverview}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-emerald-600 flex items-center gap-2 uppercase text-xs tracking-widest">
                      <Check className="h-4 w-4" /> Recommended Priorities
                    </h4>
                    <ul className="space-y-2">
                      {(suggestion.priorityRecommendations || []).map((item, i) => (
                        <li key={i} className="text-sm bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex gap-2">
                          <span className="font-bold text-emerald-600">{i+1}.</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-red-600 flex items-center gap-2 uppercase text-xs tracking-widest">
                      <AlertTriangle className="h-4 w-4" /> Potential Conflicts
                    </h4>
                    <ul className="space-y-2">
                      {(suggestion.conflictAlerts || []).map((item, i) => (
                        <li key={i} className="text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                          {item}
                        </li>
                      ))}
                      {(!suggestion.conflictAlerts || suggestion.conflictAlerts.length === 0) && <li className="text-sm text-muted-foreground italic">No conflicts detected.</li>}
                    </ul>
                  </div>
                </div>

                <section>
                  <h4 className="font-bold text-primary flex items-center gap-2 mb-4 uppercase text-xs tracking-widest">
                    <LayoutList className="h-4 w-4" /> Suggested Daily Plan
                  </h4>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:border-l-2 before:border-muted before:h-full">
                    {(suggestion.dailyPlan || []).map((item, i) => (
                      <div key={i} className="relative pl-8 flex items-center gap-4">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 bg-muted/30 p-3 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold w-16 text-primary">{item.time}</span>
                          <span className="text-sm flex-1">{item.activity}</span>
                          <Badge variant="outline" className="text-[10px] ml-2">
                            {item.isTask ? "Task" : "Event"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                   <h4 className="font-bold text-primary text-sm mb-1 flex items-center gap-2">
                     <BrainCircuit className="h-4 w-4" /> Final Recommendation
                   </h4>
                   <p className="text-sm italic text-foreground/80">{suggestion.generalRecommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
              <History className="h-5 w-5" /> Recent Insights
            </h3>
            <div className="grid gap-4">
              {history.map((log) => (
                <Card key={log.id} className="bg-muted/20 border-dashed hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary text-sm">Query: {log.prompt}</span>
                      <span className="text-[10px] opacity-60">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{log.analysis}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
