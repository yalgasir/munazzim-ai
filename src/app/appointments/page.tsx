
"use client";

import { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CalendarPlus, Trash2, Loader2, Calendar as CalendarIcon, Clock, MapPin, Pencil, UserCheck } from "lucide-react";
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
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function AppointmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", location: "", type: "Work", attendanceStatus: "Upcoming" });
  const [editingApp, setEditingApp] = useState<any>(null);
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
      const q = collection(db, "appointments");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(apps);
        setLoading(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddAppointment = async () => {
    if (!newAppointment.title.trim() || !newAppointment.date) {
      toast({ variant: "destructive", title: "Warning", description: "Title and Date are required." });
      return;
    }
    const userId = user?.uid || user?.id;
    try {
      if (isFirebaseConfigured) {
        await addDoc(collection(db, "appointments"), { ...newAppointment, userId, createdAt: new Date().toISOString(), source: 'manual' });
      }
      setNewAppointment({ title: "", date: "", time: "", location: "", type: "Work", attendanceStatus: "Upcoming" });
      setIsAddOpen(false);
      toast({ title: "Success", description: "Appointment added." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save." });
    }
  };

  const updateAttendance = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { attendanceStatus: status });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update attendance." });
    }
  };

  const handleEditAppointment = async () => {
    if (!editingApp || !editingApp.title.trim() || !editingApp.date) return;
    try {
      if (isFirebaseConfigured) {
        const appRef = doc(db, "appointments", editingApp.id);
        const { id, ...data } = editingApp;
        await updateDoc(appRef, data);
      }
      setIsEditOpen(false);
      setEditingApp(null);
      toast({ title: "Updated", description: "Appointment updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update." });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      if (isFirebaseConfigured) {
        await deleteDoc(doc(db, "appointments", id));
      }
      toast({ title: "Deleted", description: "Appointment removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
    }
  };

  const openEdit = (app: any) => {
    setEditingApp(app);
    setIsEditOpen(true);
  };

  const filtered = appointments.filter(app => (app.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6" dir="ltr">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-4xl font-black text-foreground mb-1">Schedule</h1>
            <p className="text-sm text-muted-foreground font-medium">Coordinate your calendar and track attendance.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-8 shadow-xl font-black rounded-2xl">
                <CalendarPlus className="h-5 w-5" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent dir="ltr" className="sm:max-w-[500px]">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black text-primary">New Appointment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Title</Label>
                  <Input placeholder="Meeting name" value={newAppointment.title} onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Date</Label>
                    <Input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Time</Label>
                    <Input placeholder="10:00" value={newAppointment.time} onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Location</Label>
                  <Input placeholder="Physical or Virtual Room" value={newAppointment.location} onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})} className="h-12 rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAppointment} className="w-full h-12 text-lg font-black rounded-2xl">Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          <Input placeholder="Search mission schedule..." className="pl-12 h-14 text-left rounded-2xl border-none shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Synchronizing Workspace...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(app => (
              <Card 
                key={app.id} 
                className="group hover:shadow-2xl transition-all border-none shadow-sm rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => openEdit(app)}
              >
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className="flex-1 p-6 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-foreground">{app.title}</h3>
                      <Badge className={cn(
                        "text-[9px] uppercase font-black tracking-widest h-5",
                        app.attendanceStatus === 'Attended' ? "bg-emerald-500" : app.attendanceStatus === 'Missed' ? "bg-rose-500" : "bg-primary"
                      )}>
                        {app.attendanceStatus || 'Upcoming'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" />{app.date}</div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{app.time || "No time set"}</div>
                      {app.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{app.location}</div>}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 group-hover:bg-primary/5 transition-colors flex items-center border-l gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-emerald-600">
                          <UserCheck className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateAttendance(app.id, 'Attended')}>Mark Attended</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendance(app.id, 'Missed')}>Mark Missed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAttendance(app.id, 'Upcoming')}>Reset to Upcoming</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary"><Pencil className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, app.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-3xl">
              <p className="text-muted-foreground font-black mb-4">No mission events found.</p>
              <Button variant="outline" className="rounded-2xl font-black" onClick={() => setIsAddOpen(true)}>Add First Event</Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mt-20" />}>
      <AppointmentsContent />
    </Suspense>
  )
}
