"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle2, Zap, ArrowRight, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { analyzeFullSchedule, AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ScheduleAnalysisWidget({ appointments, tasks }: { appointments: any[], tasks: any[] }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const safeApps = appointments.map(a => ({
        title: String(a.title || "Untitled"),
        date: String(a.date || ""),
        time: String(a.time || "")
      }));

      const safeTasks = tasks.map(t => ({
        description: String(t.description || "Untitled"),
        priority: String(t.priority || "Medium"),
        isCompleted: Boolean(t.isCompleted)
      }));

      const result = await analyzeFullSchedule(safeApps, safeTasks);
      setAnalysis(result);
      setLastAnalyzed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast({ title: "Analysis Complete", description: "Your schedule has been optimized." });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="shadow-sm border-primary/20 bg-primary/5 hover:border-primary/40 transition-all group overflow-hidden">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <BrainCircuit className="h-6 w-6" />
            </div>
            {lastAnalyzed && !loading && (
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-white border px-2 py-0.5 rounded-full">
                Updated {lastAnalyzed}
              </span>
            )}
          </div>
          <div className="pt-4 space-y-1">
            <CardTitle className="text-lg font-bold">AI Schedule Analysis</CardTitle>
            <CardDescription className="text-xs font-medium">
              Get workload insights and optimize your daily plan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 space-y-4">
          {!analysis && !loading ? (
             <div className="py-4 space-y-3">
               <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                 <Clock className="h-3 w-3" /> Ready for optimization
               </div>
               <Button onClick={runAnalysis} className="w-full h-11 font-bold gap-2 shadow-lg shadow-primary/20">
                 Analyze My Schedule
               </Button>
             </div>
          ) : loading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Computing daily plan...</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Quick Scan</span>
                    <Badge variant="outline" className="text-[8px] h-4 font-black text-emerald-600 bg-emerald-50 border-emerald-100 uppercase">Ready</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <AlertTriangle className="h-3 w-3" /> {analysis.conflictAlerts.length} Conflicts
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> {analysis.dailyPlan.length} Actions
                    </div>
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                 <Button onClick={() => setDialogOpen(true)} variant="outline" className="w-full h-10 font-bold text-xs gap-2 border-primary/20 text-primary">
                    View Full Report <ArrowRight className="h-3 w-3" />
                 </Button>
                 <Button variant="ghost" size="sm" onClick={runAnalysis} className="text-[9px] font-bold uppercase text-muted-foreground hover:bg-transparent hover:text-primary gap-1.5 mx-auto">
                    <RefreshCw className="h-3 w-3" /> Re-Analyze
                 </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
              <BrainCircuit className="h-8 w-8" /> Intelligence Report
            </DialogTitle>
            <p className="text-primary-foreground/80 text-sm mt-1">AI-optimized workspace strategy for today.</p>
          </DialogHeader>

          {analysis && (
            <div className="p-8 space-y-8 text-left">
              <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h4 className="font-bold text-primary flex items-center gap-2 mb-3 text-lg">
                  <TrendingUp className="h-5 w-5" /> Today's Overview
                </h4>
                <p className="text-sm leading-relaxed font-medium text-foreground/90">{analysis.todayOverview}</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-100 bg-emerald-50/50 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-bold text-emerald-700 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                      <CheckCircle2 className="h-4 w-4" /> Recommended Priorities
                    </h4>
                    <ul className="space-y-2">
                      {analysis.priorityRecommendations?.map((rec, i) => (
                        <li key={i} className="text-sm flex gap-3 items-start font-medium text-emerald-900/80">
                          <span className="h-5 w-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i+1}</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/50 shadow-none">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-bold text-red-700 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                      <AlertTriangle className="h-4 w-4" /> Conflict Alerts
                    </h4>
                    <ul className="space-y-2">
                      {analysis.conflictAlerts?.map((alert, i) => (
                        <li key={i} className="text-sm flex gap-3 items-start text-red-900/80 font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                          <span>{alert}</span>
                        </li>
                      ))}
                      {(!analysis.conflictAlerts || analysis.conflictAlerts.length === 0) && <li className="text-sm text-muted-foreground italic">System optimal. No conflicts.</li>}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <section className="space-y-6">
                <h4 className="font-bold text-primary flex items-center gap-2 uppercase text-[10px] tracking-widest px-2">
                  <Clock className="h-4 w-4" /> Optimized Execution Plan
                </h4>
                <div className="space-y-3 border-l-2 border-primary/20 ml-6 pl-8 relative">
                  {analysis.dailyPlan?.map((step, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-4 border-primary shadow-sm" />
                      <div className={cn(
                        "flex gap-4 items-center p-4 rounded-xl transition-all border shadow-sm",
                        step.isTask ? "bg-white" : "bg-primary/[0.03] border-primary/10"
                      )}>
                        <span className="text-xs font-black text-primary w-14 shrink-0">{step.time}</span>
                        <span className="text-sm font-semibold">{step.activity}</span>
                        <Badge variant="outline" className="ml-auto text-[9px] uppercase font-black border-primary/20 bg-white">
                          {step.isTask ? "Task" : "Event"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-6 bg-primary text-white rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="h-32 w-32 rotate-12" />
                </div>
                <h4 className="font-bold flex items-center gap-2 mb-2 text-lg">
                  <Zap className="h-5 w-5 fill-white" /> Pro-Tip: Strategic Focus
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-90">{analysis.generalRecommendation}</p>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}