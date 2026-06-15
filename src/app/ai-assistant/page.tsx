"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, BrainCircuit, Loader2, Check, Cpu, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-context";
import { collection, query, where, getDocs, addDoc, orderBy, limit, onSnapshot } from "firebase/firestore";
import { optimizeSchedule, OptimizeScheduleOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Badge } from "@/components/ui/badge";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<OptimizeScheduleOutput | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!user) return;

    if (isFirebaseConfigured) {
      const q = query(
        collection(db, "ai_logs"),
        where("userId", "==", user.uid || user.id),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const unsub = onSnapshot(q, (snap) => {
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
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

      if (isFirebaseConfigured) {
        const qApps = query(collection(db, "appointments"));
        const qTasks = query(collection(db, "tasks"));
        const [appSnap, taskSnap] = await Promise.all([getDocs(qApps), getDocs(qTasks)]);

        currentAppointments = appSnap.docs.map(doc => ({
          title: doc.data().title || "Untitled",
          startTime: `${doc.data().date}T${doc.data().time || "00:00"}:00Z`,
          endTime: `${doc.data().date}T${doc.data().time || "01:00"}:00Z`,
        }));

        currentTasks = taskSnap.docs.map(doc => ({
          description: doc.data().description || "Untitled",
          priority: doc.data().priority || "Medium",
          isCompleted: !!doc.data().isCompleted,
        }));
      }

      const result = await optimizeSchedule({
        currentAppointments,
        currentTasks,
        productivityContext: context,
      });

      if (result) {
        setSuggestion(result);
        
        // Log interaction to Firestore
        if (isFirebaseConfigured) {
          await addDoc(collection(db, "ai_logs"), {
            userId,
            prompt: context,
            analysis: result.summaryAnalysis,
            suggestions: result.personalizedSuggestions,
            createdAt: new Date().toISOString(),
            model: "MythoMax-L2-13B"
          });
        }

        toast({
          title: "Analysis Saved",
          description: "The AI insight has been synchronized with your database.",
        });
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not sync with AI engine or Database.",
      });
    } finally {
      setLoading(false);
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
            Connected to Firestore. Every analysis is logged and available to your workspace group.
          </p>
          <Badge variant="outline" className="mt-2 gap-1.5 py-1 px-3 border-primary/30 text-primary">
            <Cpu className="h-3.5 w-3.5" /> Engine: MythoMax-L2 via Cloud
          </Badge>
        </div>

        <Card className="border-primary/10 shadow-lg bg-card overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <Textarea
              placeholder="Describe your current bottleneck or ask for a schedule review..."
              className="min-h-[140px] text-lg p-4 text-left border-primary/20 focus:ring-primary/30 transition-all"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <Button
              className="w-full h-14 text-xl font-bold gap-3 shadow-md transition-all active:scale-[0.98]"
              onClick={handleOptimize}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {loading ? "Generating & Syncing..." : "Analyze Workspace Data"}
            </Button>
          </CardContent>
        </Card>

        {suggestion && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-700 flex items-center gap-2 text-xl">
                  <Sparkles className="h-6 w-6" /> Assistant Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="leading-relaxed text-lg whitespace-pre-wrap font-medium text-left mb-6">
                  {suggestion.summaryAnalysis}
                </div>
                {suggestion.personalizedSuggestions && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                      <Check className="h-5 w-5" /> Next Steps:
                    </h4>
                    <div className="grid gap-2">
                      {suggestion.personalizedSuggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</div>
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

        {history.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
              <History className="h-5 w-5" /> Recent Workspace Insights
            </h3>
            <div className="grid gap-4">
              {history.map((log) => (
                <Card key={log.id} className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary">Prompt: {log.prompt.substring(0, 50)}...</span>
                      <span className="text-[10px] opacity-60">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="line-clamp-2 italic text-muted-foreground">{log.analysis}</p>
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
