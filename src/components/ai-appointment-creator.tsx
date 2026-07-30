
"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check, Calendar, ListTodo, MapPin, Users, AlertTriangle, Clock } from "lucide-react";
import { createSchedule, CreateScheduleOutput } from "@/ai/flows/create-schedule-flow";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface AIAppointmentCreatorProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AIAppointmentCreator({ isOpen = false, onClose }: AIAppointmentCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(isOpen);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateScheduleOutput | null>(null);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val && onClose) onClose();
  };

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
      handleOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to parse input. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !user || !db) return;
    setLoading(true);
    try {
      const userId = user.uid || user.id;
      
      await addDoc(collection(db, "appointments"), {
        ...result.appointment,
        userId,
        source: "ai_generated",
        createdAt: new Date().toISOString()
      });

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
      if (onClose) onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Storage Error", description: "Failed to save to database." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-primary" /> Describe Your Plans
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-left">
              Describe your meeting, call, or project. AI will create the event and all necessary preparation tasks.
            </p>
            <Textarea 
              placeholder="e.g., 'Project kickoff with the design team next Tuesday at 2pm for one hour. I need to prepare the slides and invite the engineers.'"
              className="min-h-[120px] text-lg p-4"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="flex-[2] h-12 font-bold text-lg gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Generate Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-emerald-600 text-white rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Check className="h-8 w-8" /> Confirm AI Plan
            </DialogTitle>
            <p className="text-emerald-50 text-sm mt-1">Review the extracted details and tasks before saving.</p>
          </DialogHeader>
          
          {result && (
            <div className="space-y-6 text-left p-6">
              <section className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2 text-primary">
                  <Calendar className="h-5 w-5" /> Appointment Details
                </h3>
                <div className="grid gap-2 bg-muted/30 p-4 rounded-xl">
                  <p className="font-bold text-xl">{result.appointment.title}</p>
                  <p className="text-sm text-muted-foreground">{result.appointment.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary" /> {result.appointment.startTime} - {result.appointment.endTime}</div>
                    <div className="flex items-center gap-2 font-medium"><Calendar className="h-4 w-4 text-primary" /> {result.appointment.date}</div>
                    {result.appointment.location && <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-primary" /> {result.appointment.location}</div>}
                    {result.appointment.participants && <div className="flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-primary" /> {result.appointment.participants.length} participants</div>}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2 text-primary">
                  <ListTodo className="h-5 w-5" /> Action Plan & Tasks
                </h3>
                <div className="space-y-2">
                  {result.tasks.map((task, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white border border-primary/10 rounded-xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold">{task.description}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{task.category} • Due: {task.dueDate || 'ASAP'}</span>
                      </div>
                      <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="px-3">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              {result.conflictWarning && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">{result.conflictWarning}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-6 bg-muted/20 border-t rounded-b-lg gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={loading} className="h-12 px-8">Back to Edit</Button>
            <Button onClick={handleConfirm} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 font-bold gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              Save Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
