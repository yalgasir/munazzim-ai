"use client";

import { useState } from "react";
import type { PerformanceAnalysisOutput } from "@/ai/flows/ai-performance-analysis-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrainCircuit, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-context";

function displaySummary(summary: string): string {
  return /^\s*\d+(?:\.\d+)?%\s*$/.test(summary)
    ? `Task completion rate: ${summary.trim()}`
    : summary;
}

export function ScheduleAnalysisWidget({ appointments = [], tasks = [] }: { appointments: any[]; tasks: any[] }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PerformanceAnalysisOutput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("You must be signed in to analyze your schedule.");
      const response = await fetch("/api/ai/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid || user.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not reach AI engine.");
      setAnalysis(body as PerformanceAnalysisOutput);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error?.message || "Could not reach AI engine.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/[0.03] to-purple-500/[0.03]">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" /> AI Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          {loading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : analysis ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">AI Analysis</p>
                <p className="mt-1 text-sm font-medium leading-relaxed">{displaySummary(analysis.summary)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recommendations</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs">
                  {analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                </ol>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setDialogOpen(true)} className="flex-1 h-8 text-xs">Full Report</Button>
                <Button onClick={runAnalysis} variant="ghost" size="icon" className="h-8 w-8" aria-label="Refresh analysis">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={runAnalysis} size="sm" className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Sparkles className="h-3 w-3 text-white" /> Analyze My Schedule
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Intelligence Report</DialogTitle></DialogHeader>
          {analysis && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold">AI Analysis</h3>
                <p className="mt-2 text-sm leading-relaxed">{displaySummary(analysis.summary)}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold">Recommendations</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
