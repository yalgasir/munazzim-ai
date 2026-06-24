"use client";

import { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle, Circle, Loader2, Clock, Pencil } from "lucide-react";
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
  const [newTask, setNewTask] = useState({ description: "", priority: "Medium" });
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
    } else {
      const loadLocalTasks = () => {
        const userId = user.uid || user.id;
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const userTasks = allTasks.filter((t: any) => t.userId === userId);
        setTasks(userTasks);
        setLoading(false);
      };
      loadLocalTasks();
      window.addEventListener('storage', loadLocalTasks);
      return () => window.removeEventListener('storage', loadLocalTasks);
    }
  }, [user]);

  const handleAddTask = async () => {
    if (!newTask.description.trim()) return;
    const userId = user?.uid || user?.id;
    try {
      if (isFirebaseConfigured) {
        await addDoc(collection(db, "tasks"), { ...newTask, isCompleted: false, userId, createdAt: new Date().toISOString() });
      } else {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const taskObj = { ...newTask, id: `task_${Date.now()}`, isCompleted: false, userId, createdAt: new Date().toISOString() };
        allTasks.push(taskObj);
        localStorage.setItem("mock_tasks", JSON.stringify(allTasks));
        setTasks(prev => [...prev, taskObj]);
      }
      setNewTask({ description: "", priority: "Medium" });
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
        await updateDoc(taskRef, data);
      } else {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const updated = allTasks.map((t: any) => t.id === editingTask.id ? editingTask : t);
        localStorage.setItem("mock_tasks", JSON.stringify(updated));
        setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      }
      setIsEditOpen(false);
      setEditingTask(null);
      toast({ title: "Updated", description: "Task has been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update task." });
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, "tasks", id), { isCompleted: !currentStatus });
      } else {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const updated = allTasks.map((t: any) => t.id === id ? { ...t, isCompleted: !currentStatus } : t);
        localStorage.setItem("mock_tasks", JSON.stringify(updated));
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !currentStatus } : t));
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (isFirebaseConfigured) {
        await deleteDoc(doc(db, "tasks", id));
      } else {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const filtered = allTasks.filter((t: any) => t.id !== id);
        localStorage.setItem("mock_tasks", JSON.stringify(filtered));
        setTasks(prev => prev.filter(t => t.id !== id));
      }
      toast({ title: "Deleted", description: "Task removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete task." });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto" dir="ltr">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline text-primary">My Tasks</h1>
            <p className="text-muted-foreground">Keep track of your daily tasks.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-6 shadow-md">
                <Plus className="h-5 w-5" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent dir="ltr">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-bold text-primary">New Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Description</Label>
                  <Input placeholder="What needs to be done?" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="h-11" />
                </div>
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} className="w-full h-12 text-lg font-bold">Save Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent dir="ltr">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold text-primary">Edit Task</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Description</Label>
                  <Input value={editingTask.description} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} className="h-11" />
                </div>
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Priority</Label>
                  <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({...editingTask, priority: v})}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditTask} className="w-full h-12 text-lg font-bold">Update Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Syncing Tasks...</p>
            </div>
          ) : tasks.length > 0 ? (
            tasks.sort((a, b) => (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1).map((task) => (
              <Card key={task.id} className={cn("group transition-all hover:shadow-lg border-primary/5 hover:border-primary/20 overflow-hidden", task.isCompleted && "opacity-75 grayscale-[0.2]")}>
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className={cn("w-2 self-stretch", task.priority === "High" ? "bg-red-500" : task.priority === "Medium" ? "bg-orange-500" : "bg-emerald-500")} />
                  <div className="flex-1 p-6 flex items-center gap-4 text-left">
                    <button onClick={() => toggleTask(task.id, task.isCompleted)} className="transition-transform active:scale-90">
                      {task.isCompleted ? <CheckCircle className="h-8 w-8 text-emerald-500 fill-emerald-50" /> : <Circle className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xl font-bold transition-all", task.isCompleted ? "line-through text-muted-foreground" : "text-primary")}>{task.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-2 uppercase font-bold", task.priority === "High" ? "border-red-500 text-red-600 bg-red-50" : task.priority === "Medium" ? "border-orange-500 text-orange-600 bg-orange-50" : "border-emerald-500 text-emerald-600 bg-emerald-50")}>{task.priority} Priority</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Just now"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 group-hover:bg-primary/5 transition-colors flex items-center border-l gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setIsEditOpen(true); }} className="text-muted-foreground hover:text-primary hover:bg-transparent">
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive hover:bg-transparent">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center gap-4 bg-muted/10">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">All caught up!</h3>
                <p className="text-muted-foreground">Connected to Firestore. No tasks found.</p>
              </div>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add Task</Button>
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