"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, X, Calendar, ListTodo, MapPin, Users, Target } from "lucide-react";
import { createSchedule, CreateScheduleOutput } from "@/ai/flows/create-schedule-flow";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

export function AIAppointmentCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateScheduleOutput | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const output = await createSchedule({
        userInput: prompt,
        currentDate: new Date().toISOString()
      });
      setResult(output);
      setPreviewOpen(true);
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to parse input. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !user) return;
    setLoading(true);
    try {
      const userId = user.uid || user.id;
      
      // Save Appointment
      await addDoc(collection(db, "appointments"), {
        ...result.appointment,
        userId,
        source: "ai_generated",
        createdAt: new Date().toISOString()
      });

      // Save Tasks
      for (const task of result.tasks) {
        await addDoc(collection(db, "tasks"), {
          ...task,
          userId,
          isCompleted: false,
          source: "ai_generated",
          createdAt: new Date().toISOString()
        });
      }

      toast({ title: "Success", description: "Appointment and tasks created!" });
      setPreviewOpen(false);
      setPrompt("");
    } catch (error) {
      toast({ variant: "destructive", title: "Storage Error", description: "Failed to save to database." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 shadow-lg bg-primary">
            <Sparkles className="h-5 w-5" /> Create with AI
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>AI Appointment Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-left">
              Describe your meeting, call, or project. AI will create the event and all necessary preparation tasks.
            </p>
            <Textarea 
              placeholder="e.g., 'Project kickoff with the design team next Tuesday at 2pm for one hour. I need to prepare the slides and invite the engineers.'"
              className="min-h-[120px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-6 w-6 text-emerald-500" /> Confirm AI Plan
            </DialogTitle>
          </DialogHeader>
          
          {result && (
            <div className="space-y-6 text-left py-4">
              <section className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                  <Calendar className="h-5 w-5 text-primary" /> Appointment Details
                </h3>
                <div className="grid gap-2">
                  <p className="font-bold text-primary">{result.appointment.title}</p>
                  <p className="text-sm text-muted-foreground">{result.appointment.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {result.appointment.startTime} - {result.appointment.endTime}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {result.appointment.date}</div>
                    {result.appointment.location && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {result.appointment.location}</div>}
                    {result.appointment.participants && <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {result.appointment.participants.length} people</div>}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                  <ListTodo className="h-5 w-5 text-primary" /> Generated Tasks
                </h3>
                <div className="space-y-2">
                  {result.tasks.map((task, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg text-sm border border-primary/5">
                      <span>{task.description}</span>
                      <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                    </div>
                  ))}
                </div>
              </section>

              {result.conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">{result.conflictWarning}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={loading} className="bg-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save All to Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
