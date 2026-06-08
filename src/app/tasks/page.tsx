
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle, Circle, Loader2 } from "lucide-react";
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
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: "", priority: "Medium" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tsks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tsks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.description.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        isCompleted: false,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setNewTask({ description: "", priority: "Medium" });
      setIsAddOpen(false);
      toast({ title: "تمت الإضافة", description: "أضيفت المهمة بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في حفظ المهمة." });
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "tasks", id), { isCompleted: !currentStatus });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في تحديث الحالة." });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
      toast({ variant: "destructive", title: "تم الحذف", description: "تم حذف المهمة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في الحذف." });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-row-reverse">
          <h1 className="text-3xl font-bold font-headline">مهامي الخاصة</h1>
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
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <Card key={task.id} className={cn("border-r-4", task.priority === "High" ? "border-r-red-500" : "border-r-amber-500")}>
                <CardContent className="p-4 flex items-center gap-4 flex-row-reverse">
                  <button onClick={() => toggleTask(task.id, task.isCompleted)}>
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
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">لا توجد مهام مضافة حالياً.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
