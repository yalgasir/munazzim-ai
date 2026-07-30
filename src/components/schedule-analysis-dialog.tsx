"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle2, Zap, LayoutList, History, Calendar, TrendingUp } from "lucide-react";
import { analyzeFullSchedule, AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function ScheduleAnalysisDialog({ appointments, tasks }: { appointments: any[], tasks: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      // Ensure only plain serializable data is sent to the Server Action
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
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred."
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val && !analysis) runAnalysis();
    }}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/40 transition-all shadow-md group border-primary/10">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Schedule Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1">Get workload insights & daily plans</p>
            </div>
            <Button variant="secondary" className="w-full mt-2">Analyze My Schedule</Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl border-b pb-4">
            <BrainCircuit className="h-7 w-7 text-primary" /> Workspace Intelligence Report
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing tasks and appointments...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-8 py-4 text-left">
            <section className="bg-primary/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
              <h4 className="font-bold text-primary flex items-center gap-2 mb-3 text-lg uppercase tracking-tight">
                <TrendingUp className="h-5 w-5" /> Today's Overview
              </h4>
              <p className="text-sm leading-relaxed font-medium">{analysis.todayOverview}</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-emerald-100 bg-emerald-50/30">
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <CheckCircle2 className="h-4 w-4" /> Priority Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysis.priorityRecommendations?.map((rec, i) => (
                      <li key={i} className="text-sm flex gap-3 items-start">
                        <span className="h-5 w-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i+1}</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-100 bg-red-50/30">
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-bold text-red-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <AlertTriangle className="h-4 w-4" /> Conflict Alerts
                  </h4>
                  <ul className="space-y-2">
                    {analysis.conflictAlerts?.map((alert, i) => (
                      <li key={i} className="text-sm flex gap-3 items-start text-red-900/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                        <span>{alert}</span>
                      </li>
                    ))}
                    {(!analysis.conflictAlerts || analysis.conflictAlerts.length === 0) && <li className="text-sm text-muted-foreground italic">System optimal. No conflicts.</li>}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h4 className="font-bold text-primary flex items-center gap-2 uppercase text-xs tracking-widest px-2">
                <LayoutList className="h-4 w-4" /> Optimized Execution Plan
              </h4>
              <div className="space-y-3 border-l-2 border-primary/20 ml-4 pl-6 relative">
                {analysis.dailyPlan?.map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary border-4 border-white shadow-sm" />
                    <div className={cn(
                      "flex gap-4 items-center p-3 rounded-xl transition-all hover:shadow-md",
                      step.isTask ? "bg-white border border-border" : "bg-primary/5 border border-primary/10"
                    )}>
                      <span className="text-xs font-bold text-primary w-14 shrink-0">{step.time}</span>
                      <span className="text-sm font-medium">{step.activity}</span>
                      <Badge variant="outline" className="ml-auto text-[9px] uppercase tracking-tighter">
                        {step.isTask ? "Task" : "Event"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <h5 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <History className="h-3 w-3" /> Upcoming Deadlines
                  </h5>
                  <ul className="text-xs space-y-1">
                    {analysis.upcomingDeadlines?.map((d, i) => <li key={i}>- {d}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <h5 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Focus Windows
                  </h5>
                  <ul className="text-xs space-y-1">
                    {analysis.availableSlots?.map((s, i) => <li key={i}>- {s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <section className="p-5 bg-primary text-white rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="h-24 w-24 rotate-12" />
                </div>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 fill-white" /> Pro-Tip: Strategic Focus
              </h4>
              <p className="text-sm font-medium leading-relaxed">{analysis.generalRecommendation}</p>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
