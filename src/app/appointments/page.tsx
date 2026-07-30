
"use client";

import { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CalendarPlus, Trash2, Loader2, Calendar as CalendarIcon, Clock, MapPin, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";
import { useSearchParams } from "next/navigation";

function AppointmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", location: "", type: "Work" });
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
    } else {
      const loadLocalData = () => {
        const userId = user.uid || user.id;
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const userApps = allApps.filter((app: any) => app.userId === userId);
        setAppointments(userApps);
        setLoading(false);
      };
      loadLocalData();
      window.addEventListener('storage', loadLocalData);
      return () => window.removeEventListener('storage', loadLocalData);
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
      } else {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const newApp = { ...newAppointment, id: `app_${Date.now()}`, userId, createdAt: new Date().toISOString(), source: 'manual' };
        allApps.push(newApp);
        localStorage.setItem("mock_appointments", JSON.stringify(allApps));
        setAppointments(prev => [...prev, newApp]);
      }
      setNewAppointment({ title: "", date: "", time: "", location: "", type: "Work" });
      setIsAddOpen(false);
      toast({ title: "Success", description: "Appointment added." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save." });
    }
  };

  const handleEditAppointment = async () => {
    if (!editingApp || !editingApp.title.trim() || !editingApp.date) return;
    try {
      if (isFirebaseConfigured) {
        const appRef = doc(db, "appointments", editingApp.id);
        const { id, ...data } = editingApp;
        await updateDoc(appRef, data);
      } else {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const updated = allApps.map((a: any) => a.id === editingApp.id ? editingApp : a);
        localStorage.setItem("mock_appointments", JSON.stringify(updated));
        setAppointments(prev => prev.map(a => a.id === editingApp.id ? editingApp : a));
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
      } else {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const filtered = allApps.filter((app: any) => app.id !== id);
        localStorage.setItem("mock_appointments", JSON.stringify(filtered));
        setAppointments(prev => prev.filter(app => app.id !== id));
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
            <h1 className="text-3xl font-bold font-headline mb-1 text-primary">Appointments</h1>
            <p className="text-muted-foreground">Manage your schedule.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-11 px-6 shadow-md">
                <CalendarPlus className="h-5 w-5" />
                Add New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent dir="ltr" className="sm:max-w-[500px]">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-bold text-primary">New Appointment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Title</Label>
                  <Input placeholder="Meeting name" value={newAppointment.title} onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Date</Label>
                    <Input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} className="h-11" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Time</Label>
                    <Input placeholder="10:00" value={newAppointment.time} onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} className="h-11" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Location</Label>
                  <Input placeholder="Optional" value={newAppointment.location} onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})} className="h-11" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAppointment} className="w-full h-12 text-lg font-bold">Save Appointment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent dir="ltr" className="sm:max-w-[500px]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold text-primary">Edit Appointment</DialogTitle>
            </DialogHeader>
            {editingApp && (
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Title</Label>
                  <Input value={editingApp.title} onChange={(e) => setEditingApp({...editingApp, title: e.target.value})} className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Date</Label>
                    <Input type="date" value={editingApp.date} onChange={(e) => setEditingApp({...editingApp, date: e.target.value})} className="h-11" />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="font-bold">Time</Label>
                    <Input value={editingApp.time} onChange={(e) => setEditingApp({...editingApp, time: e.target.value})} className="h-11" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label className="font-bold">Location</Label>
                  <Input value={editingApp.location} onChange={(e) => setEditingApp({...editingApp, location: e.target.value})} className="h-11" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditAppointment} className="w-full h-12 text-lg font-bold">Update Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 h-12 text-left" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Syncing Appointments...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(app => (
              <Card 
                key={app.id} 
                className="group hover:shadow-lg transition-all border-primary/5 hover:border-primary/20 overflow-hidden cursor-pointer"
                onClick={() => openEdit(app)}
              >
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className="flex-1 p-6 text-left">
                    <h3 className="text-xl font-bold text-primary mb-2">{app.title}</h3>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{app.date}</div>
                      <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{app.time || "Not set"}</div>
                      {app.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{app.location}</div>}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 group-hover:bg-primary/5 transition-colors flex items-center border-l gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Pencil className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, app.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-20 text-center bg-muted/10">
              <p className="text-muted-foreground">No appointments found.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddOpen(true)}>Add Now</Button>
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
