
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CheckCircle, Circle, Loader2, Flag } from "lucide-react";
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
import { db, auth, isFirebaseConfigured } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: "", priority: "Medium" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const userId = user.uid || user.id;

    if (isFirebaseConfigured) {
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", userId)
      );

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
      // وضع المحاكاة
      const loadLocalTasks = () => {
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
        await addDoc(collection(db, "tasks"), {
          ...newTask,
          isCompleted: false,
          userId,
          createdAt: new Date().toISOString()
        });
      } else {
        const allTasks = JSON.parse(localStorage.getItem("mock_tasks") || "[]");
        const taskObj = {
          ...newTask,
          id: `task_${Date.now()}`,
          isCompleted: false,
          userId,
          createdAt: new Date().toISOString()
        };
        allTasks.push(taskObj);
        localStorage.setItem("mock_tasks", JSON.stringify(allTasks));
        setTasks(prev => [...prev, taskObj]);
      }

      setNewTask({ description: "", priority: "Medium" });
      setIsAddOpen(false);
      toast({ title: "تمت الإضافة", description: "أضيفت المهمة بنجاح إلى قائمة مهامك." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في حفظ المهمة." });
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
      toast({ variant: "destructive", title: "خطأ", description: "فشل في تحديث الحالة." });
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
      toast({ title: "تم الحذف", description: "تم حذف المهمة بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في الحذف." });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline">قائمة مهامي</h1>
            <p className="text-muted-foreground">تتبع إنجازاتك اليومية ورتب أولوياتك.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-6 shadow-md">
                <Plus className="h-5 w-5" />
                إضافة مهمة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle className="text-2xl font-bold">إضافة مهمة جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-right">
                  <Label className="font-bold">وصف المهمة</Label>
                  <Input 
                    placeholder="ماذا تود إنجازه؟" 
                    value={newTask.description} 
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})} 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="font-bold">مستوى الأهمية</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger dir="rtl" className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">عالية جداً (أولوية قصوى)</SelectItem>
                      <SelectItem value="Medium">متوسطة</SelectItem>
                      <SelectItem value="Low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask} className="w-full h-12 text-lg font-bold">حفظ المهمة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">جاري تحميل مهامك...</p>
            </div>
          ) : tasks.length > 0 ? (
            tasks.sort((a, b) => (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1).map((task) => (
              <Card 
                key={task.id} 
                className={cn(
                  "group transition-all border-r-4", 
                  task.priority === "High" ? "border-r-red-500" : task.priority === "Medium" ? "border-r-amber-500" : "border-r-emerald-500",
                  task.isCompleted && "opacity-75 grayscale-[0.5]"
                )}
              >
                <CardContent className="p-4 flex items-center gap-4 flex-row-reverse">
                  <button 
                    onClick={() => toggleTask(task.id, task.isCompleted)}
                    className="transition-transform active:scale-90"
                  >
                    {task.isCompleted ? (
                      <CheckCircle className="h-8 w-8 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 text-right">
                    <span className={cn(
                      "text-lg font-medium transition-all", 
                      task.isCompleted && "line-through text-muted-foreground"
                    )}>
                      {task.description}
                    </span>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {task.priority === "High" && (
                        <Badge variant="destructive" className="text-[10px] h-5 flex items-center gap-1">
                          <Flag className="h-3 w-3" /> عاجل
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">تمت الإضافة {new Date(task.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteTask(task.id)} 
                    className="text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center gap-4 bg-muted/10">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">كل شيء تحت السيطرة!</h3>
                <p className="text-muted-foreground">لا توجد مهام معلقة حالياً. استمتع بوقتك أو أضف مهمة جديدة.</p>
              </div>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>إضافة مهمة</Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}




