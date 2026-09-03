"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-context";
import Link from "next/link";

export default function CalendarPage() {
  const { user } = useAuth();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDate(new Date());
  }, []);

  const loadAppointments = async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const userId = user.uid;

    try {
      setLoading(true);

      const [response, tasksResponse] = await Promise.all([
        fetch(`/api/appointments?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
        fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
      ]);

      if (!response.ok || !tasksResponse.ok) {
        throw new Error("Failed to load appointments");
      }

      const data = await response.json();

      setAppointments(Array.isArray(data) ? data : []);
      const tasksData = await tasksResponse.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("Calendar load error:", error);
      setAppointments([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const selectedDateString =
    mounted && date
      ? date.toLocaleDateString("en-CA")
      : "";

  const dailyItems = [
    ...appointments.filter((app) => String(app.date || "").slice(0, 10) === selectedDateString)
      .map((app) => ({ ...app, itemType: "Appointment" })),
    ...tasks.filter((task) => String(task.date || "").slice(0, 10) === selectedDateString)
      .map((task) => ({ ...task, itemType: "Task", title: task.title || task.description })),
  ];

  const formattedDate =
    mounted && date
      ? date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "...";

  return (
    <AppLayout>
      <div
        className="max-w-6xl mx-auto flex flex-col gap-6"
        dir="ltr"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold font-headline mb-1">
              Calendar
            </h1>

            <p className="text-muted-foreground">
              Real-time synchronization with your schedule.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>

            <Button className="gap-2" asChild>
              <Link href="/appointments">
                <Plus className="h-4 w-4" />
                Add Event
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm overflow-hidden border-primary/10">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center p-4 md:p-8">
                {!mounted || loading ? (
                  <div className="flex flex-col items-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />

                    <p className="text-sm text-muted-foreground">
                      Syncing calendar...
                    </p>
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-none w-full max-w-full"
                    classNames={{
                      months: "w-full",
                      month: "w-full space-y-4",
                      table: "w-full border-collapse",
                      head_row:
                        "flex w-full justify-between mb-4",
                      head_cell:
                        "text-muted-foreground font-normal text-sm w-full text-center",
                      row:
                        "flex w-full mt-2 justify-between",
                      cell:
                        "relative h-14 w-full text-center text-sm p-0 focus-within:relative focus-within:z-20",
                      day:
                        "h-12 w-12 md:h-14 md:w-14 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 transition-colors rounded-full flex items-center justify-center mx-auto",
                      day_selected:
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm border-primary/10 bg-card">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {formattedDate}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                {dailyItems.length > 0 ? (
                  dailyItems.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border-l-4 border-l-primary bg-primary/5 flex flex-col gap-1 shadow-sm transition-all hover:bg-primary/10"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-primary">
                          {app.title}
                        </span>

                        <Badge
                          variant="outline"
                          className="text-[10px] h-5"
                        >
                          {app.itemType}
                        </Badge>
                      </div>

                      <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {app.time || "No time set"}
                      </span>

                      {app.location && (
                        <span className="text-xs text-muted-foreground mt-1 truncate">
                          📍 {app.location}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      No events scheduled for this day.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-primary/5 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-primary">
                  Intelligence Note
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  Munazzim synchronizes your appointments
                  through the local server to provide
                  schedule analysis and optimization suggestions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
