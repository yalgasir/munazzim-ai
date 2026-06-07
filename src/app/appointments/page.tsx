
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, Calendar as CalendarIcon, Clock, MapPin, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", location: "", type: "عمل" });
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('munazzim_appointments');
    if (saved) {
      setAppointments(JSON.parse(saved));
    } else {
      // بيانات افتراضية لأول مرة
      const initial = [
        { id: 1, title: "مقابلة عمل", date: "2024-05-25", time: "10:30 ص", location: "عبر زووم", type: "عمل" },
        { id: 2, title: "جلسة تمرين", date: "2024-05-25", time: "05:00 م", location: "النادي الرياضي", type: "صحة" },
      ];
      setAppointments(initial);
      localStorage.setItem('munazzim_appointments', JSON.stringify(initial));
    }
  }, []);

  const saveToLocal = (data: any[]) => {
    setAppointments(data);
    localStorage.setItem('munazzim_appointments', JSON.stringify(data));
  };

  const filtered = appointments.filter(app => 
    app.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddAppointment = () => {
    if (!newAppointment.title.trim() || !newAppointment.date) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إكمال البيانات الأساسية." });
      return;
    }

    const app = { id: Date.now(), ...newAppointment };
    saveToLocal([app, ...appointments]);
    setNewAppointment({ title: "", date: "", time: "", location: "", type: "عمل" });
    setIsAddOpen(false);
    toast({ title: "تمت الإضافة", description: "تمت إضافة الموعد بنجاح." });
  };

  const handleUpdateAppointment = () => {
    const updated = appointments.map(a => a.id === editingAppointment.id ? editingAppointment : a);
    saveToLocal(updated);
    setIsEditOpen(true);
    setIsEditOpen(false);
    toast({ title: "تم التحديث", description: "تم تحديث البيانات." });
  };

  const handleDelete = (id: number) => {
    const updated = appointments.filter(a => a.id !== id);
    saveToLocal(updated);
    toast({ variant: "destructive", title: "تم الحذف", description: "تم حذف الموعد." });
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-1">المواعيد</h1>
            <p className="text-muted-foreground">جدول مواعيدك القادمة.</p>
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
          <Input placeholder="بحث..." className="pr-10 text-right" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="space-y-4">
          {filtered.map(app => (
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
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
