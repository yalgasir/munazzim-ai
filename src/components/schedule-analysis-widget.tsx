"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  RefreshCw,
  Focus,
  Activity,
  BarChart3,
  CalendarCheck
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

export function ScheduleAnalysisWidget({ appointments, tasks }: { appointments: any[], tasks: any[] }) {
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
        <CardHeader className="pb-4 px-8 pt-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg ring-4 ring-primary/10">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">AI Performance Analyzer</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Cognitive Schedule Optimization
                </CardDescription>
              </div>
            </div>
            {lastAnalyzed && !loading && (
              <Badge variant="outline" className="text-[9px] font-black text-primary bg-white/80 backdrop-blur-sm border-primary/20">
                LATEST SYNC: {lastAnalyzed}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          {!analysis && !loading ? (
             <div className="py-6 flex flex-col items-center gap-4 border-2 border-dashed border-primary/10 rounded-2xl bg-white/50">
               <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                 <Zap className="h-4 w-4 text-primary" /> System ready for deep performance analysis
               </div>
               <Button onClick={runAnalysis} className="px-10 h-12 font-black text-lg gap-3 shadow-xl hover:scale-105 transition-all">
                 <Sparkles className="h-5 w-5" /> Analyze My Schedule
               </Button>
             </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center gap-4 bg-white/30 rounded-2xl">
              <div className="relative h-12 w-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-primary opacity-50" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Running Neural Optimization...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               {/* Insight Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <InsightCard icon={Focus} label="Focus Score" value={`${analysis.focusScore}%`} color="blue" />
                 <InsightCard icon={Activity} label="Workload" value={analysis.workloadStatus} color="purple" />
                 <InsightCard icon={BarChart3} label="Balance" value={analysis.scheduleBalance} color="emerald" />
                 <InsightCard icon={Zap} label="Free Time" value={analysis.availableSlots[0] || "None"} color="orange" />
               </div>

               <div className="bg-white/70 border-2 border-primary/10 rounded-2xl p-6 shadow-sm backdrop-blur-md relative overflow-hidden group-hover:border-primary/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BrainCircuit className="h-24 w-24" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" /> Executive Summary
                    </span>
                    <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 uppercase font-black">AI Generated</Badge>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-foreground/90 mb-6 italic">
                    "{analysis.todayOverview}"
                  </p>
                  
                  {analysis.smartAlerts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {analysis.smartAlerts.map((alert, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px] gap-1.5 py-1">
                          <AlertTriangle className="h-3 w-3" /> {alert}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-3">
                    <Button onClick={() => setDialogOpen(true)} className="flex-1 h-11 font-black text-xs gap-2 shadow-md">
                        View Detailed Intelligence Report <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" onClick={runAnalysis} className="h-11 font-black text-xs gap-2 border-primary/20 text-muted-foreground hover:text-primary transition-colors">
                        <RefreshCw className="h-3 w-3" /> Refresh Analysis
                    </Button>
                  </div>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-10 bg-slate-950 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
               <BrainCircuit className="h-48 w-48" />
            </div>
            <DialogTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-tight relative z-10">
              <Zap className="h-10 w-10 text-primary fill-primary" /> Mission Intelligence Report
            </DialogTitle>
            <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest relative z-10">AI-Optimized Strategy & Performance Insights</p>
          </DialogHeader>

          {analysis && (
            <div className="p-10 space-y-10 text-left bg-slate-50/50">
              <section className="bg-white p-8 rounded-3xl border-2 border-primary/5 shadow-xl">
                <h4 className="font-black text-primary flex items-center gap-3 mb-4 text-lg uppercase tracking-tight">
                  <Activity className="h-6 w-6" /> Executive Performance Summary
                </h4>
                <p className="text-base leading-relaxed font-bold text-foreground/80">{analysis.todayOverview}</p>
                <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                      <Zap className="h-6 w-6" />
                   </div>
                   <p className="text-sm font-bold italic text-primary">"{analysis.generalRecommendation}"</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none bg-white shadow-xl rounded-3xl overflow-hidden">
                  <div className="bg-emerald-600 p-4 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Priority Recommendations
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {analysis.priorityRecommendations?.map((rec, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <span className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">{i+1}</span>
                        <span className="text-sm font-bold text-slate-700">{rec}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none bg-white shadow-xl rounded-3xl overflow-hidden">
                  <div className="bg-rose-600 p-4 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Intelligent Alerts
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {analysis.smartAlerts?.map((alert, i) => (
                      <div key={i} className="flex gap-4 items-start text-rose-900 group">
                        <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-2 animate-pulse" />
                        <span className="text-sm font-bold">{alert}</span>
                      </div>
                    ))}
                    {analysis.smartAlerts.length === 0 && <p className="text-sm text-muted-foreground italic font-medium">All systems operational. No critical alerts detected.</p>}
                  </CardContent>
                </Card>
              </div>

              <section className="space-y-6">
                <h4 className="font-black text-slate-900 flex items-center gap-3 uppercase text-xs tracking-[0.3em] px-2">
                  <CalendarCheck className="h-5 w-5 text-primary" /> Optimized Execution Timeline
                </h4>
                <div className="space-y-4 border-l-4 border-primary/10 ml-6 pl-10 relative">
                  {analysis.dailyPlan?.map((step, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[54px] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white border-4 border-primary shadow-xl z-10 transition-transform group-hover:scale-125" />
                      <div className={cn(
                        "flex gap-6 items-center p-5 rounded-2xl transition-all border-2 bg-white hover:shadow-2xl hover:border-primary/20",
                        !step.isTask && "bg-primary/[0.02]"
                      )}>
                        <div className="flex flex-col w-20 shrink-0">
                          <span className="text-xs font-black text-primary">{step.time}</span>
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{step.isTask ? "Task" : "Event"}</span>
                        </div>
                        <span className="text-sm font-black text-slate-800">{step.activity}</span>
                        <Badge variant="outline" className={cn(
                          "ml-auto text-[9px] uppercase font-black border-2",
                          step.isTask ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-primary/10 text-primary bg-primary/5"
                        )}>
                          {step.isTask ? "Action" : "Milestone"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-blue-50/50 rounded-3xl border-2 border-blue-100 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" /> Focus Insight
                    </span>
                    <p className="text-sm font-bold text-blue-900/80 leading-relaxed">
                      {analysis.productivityInsight}
                    </p>
                 </div>
                 <div className="p-6 bg-purple-50/50 rounded-3xl border-2 border-purple-100 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-2">
                      <Focus className="h-3 w-3" /> Strategic Slot
                    </span>
                    <p className="text-sm font-bold text-purple-900/80 leading-relaxed">
                      Deep focus window detected at {analysis.availableSlots[0] || "flexible period"}. Use this for high-priority mission objectives.
                    </p>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InsightCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50/50 border-blue-100",
    purple: "text-purple-600 bg-purple-50/50 border-purple-100",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    orange: "text-orange-600 bg-orange-50/50 border-orange-100",
  };

  return (
    <div className={cn("p-4 rounded-2xl border-2 transition-all hover:scale-105 flex flex-col items-center gap-2 text-center", colors[color])}>
      <Icon className="h-4 w-4" />
      <div className="space-y-0.5">
        <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{label}</p>
        <p className="text-sm font-black">{value}</p>
      </div>
    </div>
  );
}
