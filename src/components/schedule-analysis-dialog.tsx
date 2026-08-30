"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2 } from "lucide-react";
import type { AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-context";

export function ScheduleAnalysisDialog({ appointments, tasks }: { appointments: any[], tasks: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("You must be signed in to analyze your schedule.");
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

      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid || user.id,
          prompt: "Analyze my schedule and performance and give useful productivity recommendations.",
          appointments: safeApps,
          tasks: safeTasks,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "An unexpected error occurred.");
      setAnalysis(body as AnalysisOutput);
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
          <div className="space-y-6 py-4 text-left">
            <section className="bg-primary/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
              <h4 className="font-bold text-primary mb-3 text-lg">Schedule Summary</h4>
              <p className="text-sm leading-relaxed font-medium">{analysis.analysis?.summary || analysis.reply}</p>
            </section>
            {analysis.analysis && analysis.analysis.suggestions.length > 0 && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-bold text-primary">Suggestions</h4>
                  <ul className="space-y-2 list-disc pl-5">
                    {analysis.analysis.suggestions.map((suggestion, index) => <li key={index} className="text-sm">{suggestion}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}