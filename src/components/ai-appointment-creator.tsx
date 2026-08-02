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
import { Sparkles, Loader2, Check, Calendar, ListTodo, MapPin, AlertTriangle, Clock, Activity } from "lucide-react";
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
      toast({ variant: "destructive", title: "AI Error", description: "Failed to parse input." });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !user || !db) return;
    setLoading(true);
    try {
      const userId = user.uid || user.id;
      
      if (result.appointment) {
        await addDoc(collection(db, "appointments"), {
          ...result.appointment,
          userId,
          source: "ai_generated",
          attendanceStatus: "Upcoming",
          createdAt: new Date().toISOString()
        });
      }

      if (result.tasks) {
        for (const task of result.tasks) {
          await addDoc(collection(db, "tasks"), {
            ...task,
            userId,
            isCompleted: false,
            status: "Pending",
            source: "ai_generated",
            createdAt: new Date().toISOString()
          });
        }
      }

      toast({ title: "Success", description: "Workspace items created!" });
      setPreviewOpen(false);
      setPrompt("");
      if (onClose) onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Storage Error", description: "Failed to save." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" /> Intent-Based AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground text-left">
              Describe your plans naturally. AI will automatically classify and create appointments or tasks for you.
            </p>
            <Textarea 
              placeholder="e.g., 'Meet Dr. Hatem tomorrow at 10 AM then finish the quarterly report.'"
              className="min-h-[100px] text-sm p-4 rounded-xl"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="flex-[2] h-10 font-bold gap-2 rounded-xl shadow-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze Intent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Activity className="h-6 w-6" /> Review Classified Items
            </DialogTitle>
            <p className="text-primary-foreground/80 text-xs mt-1">AI detected {result?.intent} intent.</p>
          </DialogHeader>
          
          {result && (
            <div className="space-y-6 text-left p-6">
              {result.appointment && (
                <section className="space-y-3">
                  <h3 className="font-bold text-xs flex items-center gap-2 border-b pb-2 text-primary uppercase tracking-widest">
                    <Calendar className="h-4 w-4" /> Appointment Detected
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                    <p className="font-bold text-sm">{result.appointment.title}</p>
                    <div className="grid grid-cols-2 gap-4 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> {result.appointment.startTime} - {result.appointment.endTime}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-primary" /> {result.appointment.date}</div>
                      {result.appointment.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> {result.appointment.location}</div>}
                    </div>
                  </div>
                </section>
              )}

              {result.tasks && result.tasks.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-bold text-xs flex items-center gap-2 border-b pb-2 text-primary uppercase tracking-widest">
                    <ListTodo className="h-4 w-4" /> Tasks Detected
                  </h3>
                  <div className="space-y-2">
                    {result.tasks.map((task, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white border border-primary/10 rounded-xl shadow-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs">{task.description}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Due: {task.dueDate || 'ASAP'}</span>
                        </div>
                        <Badge variant="secondary" className="text-[8px] h-4">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {result.conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 font-medium">{result.conflictWarning}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 bg-muted/20 border-t rounded-b-lg gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={loading} className="h-10 rounded-xl px-6 text-xs">Back</Button>
            <Button onClick={handleConfirm} disabled={loading} className="h-10 rounded-xl px-8 font-bold gap-2 text-xs shadow-lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
