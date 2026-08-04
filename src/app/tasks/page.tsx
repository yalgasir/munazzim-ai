
"use client";

import { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle, Circle, Loader2, Clock, Pencil, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";
import { useSearchParams } from "next/navigation";

function TasksContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: "", priority: "Medium", status: "Pending", date: new Date().toISOString().split('T')[0] });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    if (isFirebaseConfigured) {
      const q = collection(db, "tasks");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tsks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(tsks);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddTask = async () => {
    if (!newTask.description.trim()) return;
    const userId = user?.uid || user?.id;
    try {
      if (isFirebaseConfigured) {
        await addDoc(collection(db, "tasks"), { 
          ...newTask, 
          isCompleted: newTask.status === 'Done', 
          userId, 
          createdAt: new Date().toISOString() 
        });
      }
      setNewTask({ description: "", priority: "Medium", status: "Pending", date: new Date().toISOString().split('T')[0] });
      setIsAddOpen(false);
      toast({ title: "Success", description: "Task added to your list." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save task." });
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.description.trim()) return;
    try {
      if (isFirebaseConfigured) {
        const taskRef = doc(db, "tasks", editingTask.id);
        const { id, ...data } = editingTask;
        await updateDoc(taskRef, { 
          ...data,
          isCompleted: editingTask.status === 'Done'
        });
      }
      setIsEditOpen(false);
      setEditingTask(null);
      toast({ title: "Updated", description: "Task has been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update task." });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", id), { 
        status: newStatus,
        isCompleted: newStatus === 'Done'
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const deleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "tasks", id));
      toast({ title: "Deleted", description: "Task removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete task." });
    }
  };

  const openEdit = (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsEditOpen(true);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto" dir="ltr">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-4xl font-black text-foreground">Mission Tasks</h1>
            <p className="text-sm text-muted-foreground font-medium">Track your personal and professional objectives.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-8 shadow-xl font-black rounded-2xl">
                <Plus className="h-5 w-5" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent dir="ltr">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black text-primary">Create Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Description</Label>
                  <Input placeholder="What needs to be done?" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Date</Label>
                    <Input type="date" value={newTask.date} onChange={(e) => setNewTask({...newTask, date: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} className="w-full h-12 text-lg font-black rounded-2xl">Deploy Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent dir="ltr">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black text-primary">Edit Task</DialogTitle>
              </DialogHeader>
              {editingTask && <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Description</Label>
                  <Input placeholder="What needs to be done?" value={editingTask.description} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Date</Label>
                    <Input type="date" value={editingTask.date} onChange={(e) => setEditingTask({...editingTask, date: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Priority</Label>
                    <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({...editingTask, priority: v})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>}
              <DialogFooter>
                <Button onClick={handleEditTask} className="w-full h-12 text-lg font-black rounded-2xl">Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Syncing Database...</p>
            </div>
          ) : tasks.length > 0 ? (
            tasks.sort((a, b) => (a.status === 'Done' ? 1 : b.status === 'Done' ? -1 : 0)).map((task) => (
              <Card 
                key={task.id} 
                className={cn(
                  "group transition-all hover:shadow-xl border-none shadow-sm rounded-2xl overflow-hidden",
                  task.status === 'Done' && "opacity-60 grayscale-[0.5]"
                )}
              >
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className={cn(
                    "w-2 self-stretch", 
                    task.priority === "High" ? "bg-rose-500" : task.priority === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  <div className="flex-1 p-6 flex items-center gap-6 text-left">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); updateStatus(task.id, task.status === 'Done' ? 'Pending' : 'Done'); }}
                        className="h-10 w-10 transition-transform active:scale-90"
                      >
                        {task.status === 'Done' ? <CheckCircle className="h-8 w-8 text-emerald-500" /> : <Circle className="h-8 w-8 text-slate-300" />}
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h3 className={cn("text-lg font-black transition-all", task.status === 'Done' && "line-through text-muted-foreground")}>{task.description}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className={cn(
                          "text-[9px] py-0 px-2 uppercase font-black tracking-widest border-2",
                          task.priority === "High" ? "border-rose-200 text-rose-600 bg-rose-50" : task.priority === "Medium" ? "border-amber-200 text-amber-600 bg-amber-50" : "border-emerald-200 text-emerald-600 bg-emerald-50"
                        )}>{task.priority} Priority</Badge>
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest"><Clock className="h-3 w-3" /> {task.date || 'No Date'}</span>
                        <Badge className={cn(
                          "text-[9px] uppercase font-black tracking-widest h-5",
                          task.status === 'In Progress' ? "bg-blue-500" : task.status === 'Done' ? "bg-emerald-500" : "bg-slate-400"
                        )}>
                          {task.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 group-hover:bg-primary/5 transition-colors flex items-center border-l gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'In Progress'); }} className="text-slate-400 hover:text-blue-600 hover:bg-transparent">
                      <PlayCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => openEdit(e, task)} className="text-slate-400 hover:text-primary hover:bg-transparent">
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => deleteTask(e, task.id)} className="text-slate-400 hover:text-rose-600 hover:bg-transparent">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-32 flex flex-col items-center justify-center text-center gap-6 bg-slate-50/50 rounded-3xl">
              <div className="h-20 w-20 bg-white shadow-xl rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-slate-200" />
              </div>
              <div>
                <h3 className="text-xl font-black">All mission objectives clear</h3>
                <p className="text-muted-foreground font-medium">No tasks found in your current workspace.</p>
              </div>
              <Button variant="outline" className="rounded-2xl font-black" onClick={() => setIsAddOpen(true)}>Add New Task</Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <TasksContent />
    </Suspense>
  );
}
