
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
    { id: 1, title: "اجتماع إداري", time: "09:00", type: "عمل" },
    { id: 2, title: "حصة تدريبية", time: "17:00", type: "صحة" },
  ];

  const formattedDate = mounted && date 
    ? date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })
    : "...";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-1">التقويم</h1>
            <p className="text-muted-foreground">جدولك الزمني الشهري واليومي.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">اليوم</Button>
            <Button variant="outline" size="sm">أسبوع</Button>
            <Button size="sm">شهر</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة حدث
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
                <CardTitle className="text-lg">أحداث {formattedDate}</CardTitle>
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
                  <p className="text-muted-foreground text-center py-8">لا توجد أحداث لهذا اليوم.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-accent/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">تذكير سريع</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  تذكر أن تخصص 15 دقيقة في نهاية اليوم لمراجعة إنجازاتك والتخطيط لليوم التالي.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

