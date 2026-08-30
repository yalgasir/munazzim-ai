"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Sparkles,
  Loader2,
  Cpu,
  CalendarPlus,
  CheckSquare,
  Save,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-context";
import type { AnalysisOutput } from "@/ai/flows/ai-schedule-optimizer-flow";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisOutput | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const actionCount = useMemo(() => {
    if (!result) return 0;
    return result.tasks.length + result.appointments.length;
  }, [result]);

  const askAI = async () => {
    if (!user || !prompt.trim()) return;

    setLoading(true);
    try {
      const userId = user.uid || user.id;
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, prompt }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI request failed.");
      const aiResult = body as AnalysisOutput;

      setResult(aiResult);

      try {
        await fetch("/api/ai-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            prompt,
            analysis: aiResult.analysis?.summary || aiResult.reply,
            recommendation: aiResult.analysis?.suggestions.join(" ") || "",
            model: `${aiResult.provider} | ${aiResult.model}`,
          }),
        });
      } catch {
        // Logging must never block the assistant.
      }
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: error?.message || "Could not reach Qwen or the local Llama fallback.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveActions = async () => {
    if (!user || !result || actionCount === 0) return;

    setSaving(true);
    try {
      const userId = user.uid || user.id;

      for (const task of result.tasks) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: "Pending",
            date: task.date || "",
            time: task.time || "",
            source: "ai_generated",
          }),
        });

        if (!response.ok) {
          throw new Error(`Could not save task: ${task.title}`);
        }
      }

      for (const appointment of result.appointments) {
        const time = appointment.startTime && appointment.endTime
          ? `${appointment.startTime} - ${appointment.endTime}`
          : appointment.startTime || "";

        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            title: appointment.title,
            date: appointment.date || "",
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            time,
            attendanceStatus: "Upcoming",
            notes: appointment.description,
            location: appointment.location || "",
            description: appointment.description,
            source: "ai_generated",
          }),
        });

        if (!response.ok) {
          throw new Error(`Could not save appointment: ${appointment.title}`);
        }
      }

      toast({
        title: "Saved",
        description: `${actionCount} AI item${actionCount === 1 ? "" : "s"} saved successfully.`,
      });

      setResult({
        ...result,
        tasks: [],
        appointments: [],
      });
    } catch (error: any) {
      console.error("AI action save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error?.message || "Could not save the AI result.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6" dir="ltr">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black">AI Assistant</h1>
          <p className="text-muted-foreground">
            Ask naturally: create a task, add an appointment, analyze your schedule, or give you ideas.
          </p>
          <Badge variant="outline" className="gap-2">
            <Cpu className="h-3.5 w-3.5" />
            {result
              ? `${result.provider} · ${result.model}`
              : "Qwen primary → Llama/Ollama fallback"}
          </Badge>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-6 space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: add a task tomorrow at 9, or analyze my schedule."
              className="min-h-[120px] text-lg"
              dir="auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  askAI();
                }
              }}
            />
            <Button
              className="w-full h-12 text-lg font-bold gap-2"
              onClick={askAI}
              disabled={loading || !prompt.trim()}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? "Thinking..." : "Ask Munazzim"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-5">
            {result.warnings && result.warnings.length > 0 && (
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Lightbulb className="h-4 w-4" /> AI Validation Warning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Some information returned by the local model was invalid:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.reply && (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" /> Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p dir="auto" className="text-base leading-relaxed whitespace-pre-wrap">
                    {result.reply}
                  </p>
                </CardContent>
              </Card>
            )}

            {actionCount > 0 && (
              <Card className="border-emerald-500/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span>AI Actions</span>
                    <Badge>{actionCount} item{actionCount === 1 ? "" : "s"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.tasks.map((task, index) => (
                    <div key={`task-${index}`} className="rounded-xl border p-4" dir="auto">
                      <div className="font-bold flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                        {task.title}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-3">
                        <span>Task</span>
                        {task.priority && <span>{task.priority}</span>}
                        {task.date && <span>{task.date}</span>}
                        {task.time && <span>{task.time}</span>}
                      </div>
                    </div>
                  ))}

                  {result.appointments.map((appointment, index) => (
                    <div key={`appointment-${index}`} className="rounded-xl border p-4" dir="auto">
                      <div className="font-bold flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4 text-blue-600" />
                        {appointment.title}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-3">
                        <span>Appointment</span>
                        {appointment.date && <span>{appointment.date}</span>}
                        {appointment.startTime && <span>{appointment.startTime}</span>}
                        {appointment.endTime && <span>→ {appointment.endTime}</span>}
                        {appointment.location && <span>{appointment.location}</span>}
                      </div>
                    </div>
                  ))}

                  <Button
                    className="w-full gap-2"
                    onClick={saveActions}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save AI Actions"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {result.analysis && (
              <Card className="border-purple-500/20">
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {result.analysis.summary && (
                    <section>
                      <h3 className="font-bold mb-1">Overview</h3>
                      <p dir="auto" className="text-muted-foreground">{result.analysis.summary}</p>
                    </section>
                  )}

                  {result.analysis.suggestions.length > 0 && (
                    <section>
                      <h3 className="font-bold mb-2">Priorities & Ideas</h3>
                      <ul className="space-y-2">
                        {result.analysis.suggestions.map((item, index) => (
                          <li key={index} dir="auto" className="rounded-lg border p-3">{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
