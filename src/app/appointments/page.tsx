"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CalendarPlus, Trash2, Loader2, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
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
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-context";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", location: "", type: "Work" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    if (isFirebaseConfigured) {
      // Fetch all appointments for the guest demo to ensure visibility of existing items
      const q = collection(db, "appointments");

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle "Value: YYYY-MM-DD" format seen in user's database
          let cleanDate = data.date || "";
          if (typeof cleanDate === 'string' && cleanDate.startsWith("Value: ")) {
            cleanDate = cleanDate.replace("Value: ", "");
          }
          return { id: doc.id, ...data, date: cleanDate };
        });
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
      toast({ variant: "destructive", title: "Warning", description: "Please complete the required fields." });
      return;
    }

    const userId = user?.uid || user?.id;

    try {
      if (isFirebaseConfigured) {
        await addDoc(collection(db, "appointments"), {
          ...newAppointment,
          userId,
          createdAt: new Date().toISOString()
        });
      } else {
        const allApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const newApp = { 
          ...newAppointment, 
          id: `app_${Date.now()}`, 
          userId, 
          createdAt: new Date().toISOString() 
        };
        allApps.push(newApp);
        localStorage.setItem("mock_appointments", JSON.stringify(allApps));
        setAppointments(prev => [...prev, newApp]);
      }

      setNewAppointment({ title: "", date: "", time: "", location: "", type: "Work" });
      setIsAddOpen(false);
      toast({ title: "Success", description: "Appointment added to your schedule." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to save appointment." });
    }
  };

  const handleDelete = async (id: string) => {
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

  const filtered = appointments.filter(app => 
    (app.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6" dir="ltr">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline mb-1">My Appointments</h1>
            <p className="text-muted-foreground">Manage your upcoming schedule.</p>
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
                <DialogTitle className="text-2xl font-bold">New Appointment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2 text-left">
                  <Label className="text-sm font-bold">Appointment Title</Label>
                  <Input 
                    placeholder="e.g., Project Meeting"
                    value={newAppointment.title} 
                    onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})} 
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <Label className="text-sm font-bold">Date</Label>
                    <Input 
                      type="date" 
                      value={newAppointment.date} 
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-sm font-bold">Time</Label>
                    <Input 
                      placeholder="10:00" 
                      value={newAppointment.time} 
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} 
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label className="text-sm font-bold">Location (Optional)</Label>
                  <Input 
                    placeholder="Enter address or link"
                    value={newAppointment.location} 
                    onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})} 
                    className="h-11"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAppointment} className="w-full h-12 text-lg font-bold">Save Appointment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search appointments..." 
            className="pl-10 h-12 text-left text-lg border-primary/20 focus:ring-primary" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Syncing with Cloud Database...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(app => (
              <Card key={app.id} className="group hover:shadow-lg transition-all border-primary/5 hover:border-primary/20 overflow-hidden">
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className="flex-1 p-6 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-primary">{app.title}</h3>
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{app.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{app.time || "Not set"}</span>
                      </div>
                      {app.location && (
                        <div className="flex items-center gap-1.5 w-full md:w-auto">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{app.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 group-hover:bg-destructive/10 transition-colors flex items-center border-l">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(app.id)} 
                      className="text-muted-foreground hover:text-destructive hover:bg-transparent"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center gap-4 bg-muted/10">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">No appointments found</h3>
                <p className="text-muted-foreground max-w-[300px]">Connected to Firebase but no appointments found. Add one to see it sync!</p>
              </div>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add Now</Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
 