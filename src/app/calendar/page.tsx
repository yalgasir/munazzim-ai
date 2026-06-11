"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDate(new Date());
  }, []);

  const appointments = [
    { id: 1, title: "Management Meeting", time: "09:00", type: "Work" },
    { id: 2, title: "Training Session", time: "17:00", type: "Health" },
  ];

  const formattedDate = mounted && date 
    ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
    : "...";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6" dir="ltr">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-1">Calendar</h1>
            <p className="text-muted-foreground">Your monthly and daily schedule.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Today</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button size="sm">Month</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center p-8">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-none w-full max-w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-4",
                    table: "w-full border-collapse",
                    head_row: "flex w-full justify-between mb-4",
                    head_cell: "text-muted-foreground font-normal text-sm w-full text-center",
                    row: "flex w-full mt-2 justify-between",
                    cell: "relative h-14 w-full text-center text-sm p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-muted transition-colors rounded-lg flex items-center justify-center",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Events for {formattedDate}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.length > 0 ? (
                  appointments.map(app => (
                    <div key={app.id} className="p-3 rounded-lg border-l-4 border-l-primary bg-secondary/20 flex flex-col gap-1">
                      <span className="font-bold">{app.title}</span>
                      <span className="text-sm text-muted-foreground">{app.time}</span>
                      <Badge variant="outline" className="w-fit text-[10px] h-5 mt-1">{app.type}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No events for this day.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-accent/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Quick Reminder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Remember to take 15 minutes at the end of the day to review your achievements and plan for tomorrow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

