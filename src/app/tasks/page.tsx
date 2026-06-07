
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle, Circle, Label } from "lucide-react";
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: "", priority: "Medium" });
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('munazzim_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const initial = [
        { id: 1, description: "كتابة مسودة خطة العمل", priority: "High", isCompleted: false },
        { id: 2, description: "الاتصال بالعملاء الجدد", priority: "Medium", isCompleted: true },
      ];
      setTasks(initial);
      localStorage.setItem('munazzim_tasks', JSON.stringify(initial));
    }
  }, []);

  const saveToLocal = (data: any[]) => {
    setTasks(data);
    localStorage.setItem('munazzim_tasks', JSON.stringify(data));
  };

  const toggleTask = (id: number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    saveToLocal(updated);
  };

  const deleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    saveToLocal(updated);
    toast({ variant: "destructive", title: "تم الحذف", description: "تم حذف المهمة." });
  };

  const handleAddTask = () => {
    if (!newTask.description.trim()) return;
    const task = { id: Date.now(), ...newTask, isCompleted: false };
    saveToLocal([task, ...tasks]);
    setNewTask({ description: "", priority: "Medium" });
    setIsAddOpen(false);
    toast({ title: "تمت الإضافة", description: "أضيفت المهمة بنجاح." });
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-row-reverse">
          <h1 className="text-3xl font-bold font-headline">المهام</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مهمة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>إضافة مهمة جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-right">
                <Label>وصف المهمة</Label>
                <Input value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
                <Label>الأولوية</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">عالية</SelectItem>
                    <SelectItem value="Medium">متوسطة</SelectItem>
                    <SelectItem value="Low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} className="w-full">حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={cn("border-r-4", task.priority === "High" ? "border-r-red-500" : "border-r-amber-500")}>
              <CardContent className="p-4 flex items-center gap-4 flex-row-reverse">
                <button onClick={() => toggleTask(task.id)}>
                  {task.isCompleted ? <CheckCircle className="h-7 w-7 text-emerald-500" /> : <Circle className="h-7 w-7 text-muted-foreground" />}
                </button>
                <span className={cn("flex-1 text-right text-lg", task.isCompleted && "line-through text-muted-foreground")}>
                  {task.description}
                </span>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="text-destructive">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
