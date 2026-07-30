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
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle2, Clock, Calendar, Zap, LayoutList } from "lucide-react";
import { analyzeFullSchedule, AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export function ScheduleAnalysisDialog({ appointments, tasks }: { appointments: any[], tasks: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeFullSchedule(appointments, tasks);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BrainCircuit className="h-7 w-7 text-primary" /> Comprehensive Schedule Analysis
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Synthesizing workspace data...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6 py-4 text-left">
            <section>
              <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5" /> Today's Overview
              </h4>
              <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">{analysis.todayOverview}</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-3">
                <h4 className="font-bold text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Priorities
                </h4>
                <ul className="space-y-2">
                  {analysis.priorityRecommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-emerald-500">•</span> {rec}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h4 className="font-bold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Conflict Alerts
                </h4>
                <ul className="space-y-2">
                  {analysis.conflictAlerts.map((alert, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-amber-500">•</span> {alert}</li>
                  ))}
                  {analysis.conflictAlerts.length === 0 && <li className="text-sm text-muted-foreground">No conflicts detected.</li>}
                </ul>
              </section>
            </div>

            <section>
              <h4 className="font-bold text-purple-600 flex items-center gap-2 mb-3">
                <LayoutList className="h-5 w-5" /> Recommended Daily Plan
              </h4>
              <div className="space-y-2 border-l-2 border-purple-200 ml-2 pl-4">
                {analysis.dailyPlan.map((step, i) => (
                  <div key={i} className="flex gap-4 items-center py-1">
                    <span className="text-xs font-mono text-muted-foreground w-16">{step.time}</span>
                    <div className={cn(
                      "flex-1 p-2 rounded text-sm",
                      step.isTask ? "bg-purple-50 border border-purple-100" : "bg-blue-50 border border-blue-100"
                    )}>
                      {step.activity}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h4 className="font-bold text-primary flex items-center gap-2 mb-1">
                <Zap className="h-5 w-5" /> AI Recommendation
              </h4>
              <p className="text-sm italic">{analysis.generalRecommendation}</p>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
