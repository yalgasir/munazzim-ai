"use client";

import { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  CalendarPlus,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Pencil,
  UserCheck,
} from "lucide-react";
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
import { useAuth } from "@/components/auth/auth-context";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function AppointmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    attendanceStatus: "Upcoming",
  });

  const [editingApp, setEditingApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddOpen(true);
    }
  }, [searchParams]);

  const loadAppointments = async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const userId = user.uid;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/appointments?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load appointments");
      }

      const data = await response.json();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load appointments error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load appointments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleAddAppointment = async () => {
    if (
      !newAppointment.title.trim() ||
      !newAppointment.date ||
      !user ||
      saving
    ) {
      if (!newAppointment.title.trim() || !newAppointment.date) {
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Title and Date are required.",
        });
      }

      return;
    }

    const userId = user.uid;

    try {
      setSaving(true);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newAppointment,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save appointment");
      }

      setNewAppointment({
        title: "",
        date: "",
        time: "",
        location: "",
        attendanceStatus: "Upcoming",
      });

      setIsAddOpen(false);

      await loadAppointments();

      toast({
        title: "Success",
        description: "Appointment added.",
      });
    } catch (error) {
      console.error("Add appointment error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAttendance = async (
    id: string,
    status: string
  ) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          attendanceStatus: status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      await loadAppointments();

      toast({
        title: "Updated",
        description: `Marked as ${status}`,
      });
    } catch (error) {
      console.error("Attendance update error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update.",
      });
    }
  };

  const handleEditAppointment = async () => {
    if (
      !editingApp ||
      !editingApp.title?.trim() ||
      !editingApp.date ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingApp),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      setIsEditOpen(false);
      setEditingApp(null);

      await loadAppointments();

      toast({
        title: "Updated",
        description: "Appointment updated.",
      });
    } catch (error) {
      console.error("Edit appointment error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();

    try {
      const response = await fetch(
        `/api/appointments?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      await loadAppointments();

      toast({
        title: "Deleted",
        description: "Appointment removed.",
      });
    } catch (error) {
      console.error("Delete appointment error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete.",
      });
    }
  };

  const openEdit = (app: any) => {
    setEditingApp({
      ...app,
      time: app.time || "",
      location: app.location || "",
    });

    setIsEditOpen(true);
  };

  const filtered = appointments.filter((app) =>
    (app.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div
        className="max-w-5xl mx-auto flex flex-col gap-6"
        dir="ltr"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-black text-foreground mb-1 uppercase tracking-tight">
              Appointments
            </h1>

            <p className="text-xs text-muted-foreground font-medium">
              Coordinate your calendar and track mission events.
            </p>
          </div>

          <Dialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 h-10 px-6 shadow-xl font-bold rounded-xl">
                <CalendarPlus className="h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>

            <DialogContent
              dir="ltr"
              className="sm:max-w-[450px]"
            >
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-black text-primary">
                  New Event
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase">
                    Title
                  </Label>

                  <Input
                    placeholder="Meeting name"
                    value={newAppointment.title}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        title: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-black uppercase">
                      Date
                    </Label>

                    <Input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          date: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-black uppercase">
                      Time
                    </Label>

                    <Input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          time: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase">
                    Location
                  </Label>

                  <Input
                    placeholder="Room or URL"
                    value={newAppointment.location}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        location: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAddAppointment}
                  disabled={saving}
                  className="w-full h-10 text-sm font-bold rounded-xl shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search mission schedule..."
            className="pl-12 h-12 text-left rounded-xl shadow-sm bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />

              <p className="text-xs text-muted-foreground">
                Synchronizing Workspace...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((app) => (
              <Card
                key={app.id}
                className="group hover:shadow-lg transition-all border-none shadow-sm rounded-xl overflow-hidden cursor-pointer"
                onClick={() => openEdit(app)}
              >
                <CardContent className="p-0 flex items-center gap-0 flex-row">
                  <div className="flex-1 p-5 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {app.title}
                      </h3>

                      <Badge
                        className={cn(
                          "text-[7px] uppercase font-black tracking-widest h-4",
                          app.attendanceStatus === "Attended"
                            ? "bg-emerald-500"
                            : app.attendanceStatus === "Missed"
                            ? "bg-rose-500"
                            : "bg-primary"
                        )}
                      >
                        {app.attendanceStatus || "Upcoming"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3 text-primary" />
                        {app.date}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary" />
                        {app.time || "No time"}
                      </div>

                      {app.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          {app.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 group-hover:bg-primary/5 transition-colors flex items-center border-l gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAttendance(
                              app.id,
                              "Attended"
                            );
                          }}
                        >
                          Mark Attended
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAttendance(
                              app.id,
                              "Missed"
                            );
                          }}
                        >
                          Mark Missed
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAttendance(
                              app.id,
                              "Upcoming"
                            );
                          }}
                        >
                          Reset to Upcoming
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(app);
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) =>
                        handleDelete(e, app.id)
                      }
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
              <p className="text-xs text-muted-foreground font-bold mb-4">
                No mission events found.
              </p>

              <Button
                variant="outline"
                className="rounded-xl font-bold text-xs"
                onClick={() => setIsAddOpen(true)}
              >
                Add Event
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <DialogContent
          dir="ltr"
          className="sm:max-w-[450px]"
        >
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black text-primary">
              Edit Appointment
            </DialogTitle>
          </DialogHeader>

          {editingApp && (
            <div className="grid gap-4 py-4">
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase">
                  Title
                </Label>

                <Input
                  value={editingApp.title || ""}
                  onChange={(e) =>
                    setEditingApp({
                      ...editingApp,
                      title: e.target.value,
                    })
                  }
                  className="h-10 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase">
                    Date
                  </Label>

                  <Input
                    type="date"
                    value={editingApp.date || ""}
                    onChange={(e) =>
                      setEditingApp({
                        ...editingApp,
                        date: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <Label className="text-[10px] font-black uppercase">
                    Time
                  </Label>

                  <Input
                    type="time"
                    value={editingApp.time || ""}
                    onChange={(e) =>
                      setEditingApp({
                        ...editingApp,
                        time: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-black uppercase">
                  Location
                </Label>

                <Input
                  value={editingApp.location || ""}
                  onChange={(e) =>
                    setEditingApp({
                      ...editingApp,
                      location: e.target.value,
                    })
                  }
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleEditAppointment}
              disabled={saving}
              className="w-full h-10 text-sm font-bold rounded-xl shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
