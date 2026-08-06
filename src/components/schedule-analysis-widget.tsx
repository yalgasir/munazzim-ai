"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  RefreshCw,
  Activity,
  CalendarCheck,
  Sparkles
} from "lucide-react";
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

export function ScheduleAnalysisWidget({ appointments = [], tasks = [] }: { appointments: any[], tasks: any[] }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeFullSchedule(appointments, tasks);
      setAnalysis(result);
      setLastAnalyzed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast({ title: "Analysis Complete", description: "AI has optimized your workspace performance." });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Could not reach AI engine."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/[0.03] to-purple-500/[0.03] hover:border-primary/40 transition-all group overflow-hidden border-2">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-md">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">AI Performance</CardTitle>
              {lastAnalyzed && (
                <p className="text-[8px] font-bold text-primary uppercase">SYNC: {lastAnalyzed}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          {!analysis && !loading ? (
             <div className="py-4 flex flex-col items-center gap-3 border-2 border-dashed border-primary/10 rounded-xl bg-white/50">
               <Button onClick={runAnalysis} variant="secondary" size="sm" className="h-8 font-black text-[10px] gap-2">
                 <Sparkles className="h-3 w-3" /> Analyze My Schedule
               </Button>
             </div>
          ) : loading ? (
            <div className="py-6 flex flex-col items-center gap-2 bg-white/30 rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Analyzing...</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-primary flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> AI Summary
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[7px] uppercase font-black",
                      analysis.workloadStatus === 'Light' ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {analysis.workloadStatus} Workload
                    </Badge>
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed text-foreground/80 line-clamp-3 italic">
                    "{analysis.todayOverview}"
                  </p>
               </div>

               <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">Recommendations:</p>
                  {(analysis.priorityRecommendations || []).slice(0, 2).map((rec, i) => (
                    <div key={i} className="flex gap-2 items-start text-[9px] font-medium">
                      <div className="h-1 w-1 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
               </div>

               <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={() => setDialogOpen(true)} className="w-full h-8 font-black text-[9px] gap-2">
                      Full Intelligence Report <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" onClick={runAnalysis} className="w-full h-7 font-black text-[8px] gap-2 text-muted-foreground hover:text-primary">
                      <RefreshCw className="h-2 w-2" /> Refresh
                  </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-950 text-white relative overflow-hidden">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight relative z-10">
              <Zap className="h-8 w-8 text-primary fill-primary" /> Intelligence Report
            </DialogTitle>
          </DialogHeader>

          {analysis && (
            <div className="p-8 space-y-8 text-left bg-slate-50/50">
              <section className="bg-white p-6 rounded-2xl border-2 border-primary/5 shadow-xl">
                <h4 className="font-black text-primary flex items-center gap-2 mb-3 text-sm uppercase">
                  <Activity className="h-5 w-5" /> Performance Summary
                </h4>
                <p className="text-sm leading-relaxed font-bold text-foreground/80">{analysis.todayOverview}</p>
                <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                   <Zap className="h-5 w-5 text-primary" />
                   <p className="text-[11px] font-bold italic text-primary">"{analysis.generalRecommendation}"</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none bg-white shadow-lg rounded-2xl overflow-hidden">
                  <div className="bg-emerald-600 p-3 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" /> Priorities
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {analysis.priorityRecommendations?.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start group">
                        <span className="h-5 w-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                        <span className="text-xs font-bold text-slate-700">{rec}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none bg-white shadow-lg rounded-2xl overflow-hidden">
                  <div className="bg-rose-600 p-3 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" /> Smart Alerts
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {analysis.smartAlerts?.map((alert, i) => (
                      <div key={i} className="flex gap-3 items-start text-rose-900">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 animate-pulse" />
                        <span className="text-xs font-bold">{alert}</span>
                      </div>
                    ))}
                    {(!analysis.smartAlerts || analysis.smartAlerts.length === 0) && <p className="text-xs text-muted-foreground italic">Optimal state detected.</p>}
                  </CardContent>
                </Card>
              </div>

              <section className="space-y-4">
                <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em] px-2">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Execution Timeline
                </h4>
                <div className="space-y-3 border-l-2 border-primary/10 ml-4 pl-6 relative">
                  {analysis.dailyPlan?.map((step, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-2 border-primary shadow-sm z-10" />
                      <div className={cn(
                        "flex gap-4 items-center p-3 rounded-xl border bg-white hover:shadow-lg transition-all",
                        !step.isTask && "bg-primary/[0.02]"
                      )}>
                        <div className="flex flex-col w-14 shrink-0">
                          <span className="text-[10px] font-black text-primary">{step.time}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{step.activity}</span>
                        <Badge variant="outline" className="ml-auto text-[8px] uppercase font-black">
                          {step.isTask ? "Action" : "Milestone"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
