
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", location: "", type: "عمل" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAppointment = async () => {
    if (!newAppointment.title.trim() || !newAppointment.date) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال البيانات الأساسية." });
      return;
    }

    try {
      await addDoc(collection(db, "appointments"), {
        ...newAppointment,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setNewAppointment({ title: "", date: "", time: "", location: "", type: "عمل" });
      setIsAddOpen(false);
      toast({ title: "تمت الإضافة", description: "تمت إضافة الموعد بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في حفظ الموعد." });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "appointments", id));
      toast({ variant: "destructive", title: "تم الحذف", description: "تم حذف الموعد." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في الحذف." });
    }
  };

  const filtered = appointments.filter(app => 
    app.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-1">مواعيدي الخاصة</h1>
            <p className="text-muted-foreground">جدول مواعيدك القادمة بأمان تام.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                موعد جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>إضافة موعد جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-right">
                <Label>عنوان الموعد</Label>
                <Input value={newAppointment.title} onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>التاريخ</Label>
                    <Input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>الوقت</Label>
                    <Input placeholder="10:00 ص" value={newAppointment.time} onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAppointment} className="w-full">حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في مواعيدك..." className="pr-10 text-right" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            filtered.map(app => (
              <Card key={app.id}>
                <CardContent className="p-6 flex items-center gap-6 flex-row-reverse">
                  <div className="flex-1 text-right">
                    <h3 className="text-xl font-bold">{app.title}</h3>
                    <div className="text-sm text-muted-foreground flex gap-4 justify-end mt-1">
                      <span>{app.time}</span>
                      <span>{app.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(app.id)} className="text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">لا توجد مواعيد مضافة بعد.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
