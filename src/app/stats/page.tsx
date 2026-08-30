"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Award,
  Activity,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ListChecks,
  CalendarCheck2,
  Zap,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  /*
   * Mark component as mounted.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Load statistics data through Next.js APIs.
   *
   * Browser
   *   ↓
   * Next.js API
   *   ↓
   * Firebase Emulator
   *
   * This allows the page to work through Ngrok without
   * connecting the browser directly to Firestore.
   */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTasks([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    const userId = user.uid || user.id;

    if (!userId) {
      setTasks([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    const loadStatsData = async () => {
      try {
        setLoading(true);

        const [tasksResponse, appointmentsResponse] =
          await Promise.all([
            fetch(
              `/api/tasks?userId=${encodeURIComponent(userId)}`,
              {
                method: "GET",
                cache: "no-store",
              }
            ),

            fetch(
              `/api/appointments?userId=${encodeURIComponent(
                userId
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            ),
          ]);

        if (!tasksResponse.ok) {
          throw new Error("Failed to load tasks");
        }

        if (!appointmentsResponse.ok) {
          throw new Error("Failed to load appointments");
        }

        const tasksData = await tasksResponse.json();
        const appointmentsData =
          await appointmentsResponse.json();

        setTasks(
          Array.isArray(tasksData)
            ? tasksData
            : []
        );

        setAppointments(
          Array.isArray(appointmentsData)
            ? appointmentsData
            : []
        );
      } catch (error) {
        console.error(
          "Statistics data loading error:",
          error
        );

        setTasks([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadStatsData();
  }, [user, authLoading]);

  /*
   * Loading screen.
   */
  if (loading || authLoading || !mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  /*
   * Calculations
   */
  const today = new Date();

  const completedTasks = tasks.filter(
    (task) =>
      task.isCompleted ||
      task.status === "Done"
  ).length;

  const totalTasks = tasks.length;

  const taskCompletionRate =
    totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;

  const attendedApps = appointments.filter(
    (appointment) =>
      appointment.attendanceStatus === "Attended"
  ).length;

  const totalApps = appointments.length;

  const attendanceRate =
    totalApps > 0
      ? (attendedApps / totalApps) * 100
      : 0;

  const overdueTasks = tasks.filter((task) => {
    const completed =
      task.isCompleted ||
      task.status === "Done";

    if (completed || !task.date) {
      return false;
    }

    return new Date(task.date) < today;
  }).length;

  const productivityScore = Math.max(
    0,
    Math.round(
      (
        taskCompletionRate +
        attendanceRate -
        overdueTasks * 10
      ) / 2
    )
  );

  /*
   * Task priority chart.
   */
  const priorityDistribution = tasks.reduce(
    (acc: any, task: any) => {
      const priority =
        task.priority || "Medium";

      acc[priority] =
        (acc[priority] || 0) + 1;

      return acc;
    },
    {
      High: 0,
      Medium: 0,
      Low: 0,
    }
  );

  const barData = [
    {
      name: "High",
      count: priorityDistribution.High,
    },
    {
      name: "Medium",
      count: priorityDistribution.Medium,
    },
    {
      name: "Low",
      count: priorityDistribution.Low,
    },
  ];

  /*
   * Weekly activity chart.
   */
  const weeklyActivity = Array.from({
    length: 7,
  })
    .map((_, i) => {
      const d = new Date();

      d.setDate(d.getDate() - i);

      const dateStr = d
        .toISOString()
        .split("T")[0];

      const dayName = d.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        }
      );

      const completed = tasks.filter(
        (task) =>
          (task.isCompleted ||
            task.status === "Done") &&
          task.date === dateStr
      ).length;

      const attended = appointments.filter(
        (appointment) =>
          appointment.attendanceStatus ===
            "Attended" &&
          appointment.date === dateStr
      ).length;

      return {
        name: dayName,
        completed,
        attended,
      };
    })
    .reverse();

  /*
   * Summary data.
   */
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High"
  );

  const highPriorityCompleted =
    highPriorityTasks.filter(
      (task) =>
        task.isCompleted ||
        task.status === "Done"
    ).length;

  const highPriorityCompletionRate =
    highPriorityTasks.length > 0
      ? (highPriorityCompleted /
          highPriorityTasks.length) *
        100
      : 0;

  const weeklyCompletedTasks =
    weeklyActivity.reduce(
      (sum, day) =>
        sum + day.completed,
      0
    );

  const pendingHighPriority =
    highPriorityTasks.filter(
      (task) =>
        !task.isCompleted &&
        task.status !== "Done"
    ).length;

  const thisWeekTotalActivity =
    weeklyActivity.reduce(
      (sum, day) =>
        sum +
        day.completed +
        day.attended,
      0
    );

  return (
    <AppLayout>
      <div
        className="max-w-7xl mx-auto flex flex-col gap-8"
        dir="ltr"
      >
        <div className="text-left">
          <h1 className="text-3xl font-bold font-headline mb-1">
            Performance Analytics
          </h1>

          <p className="text-muted-foreground">
            Precise monitoring of Key Performance
            Indicators (KPIs) and system health.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ListChecks}
            label="Task Completion"
            value={`${completedTasks} / ${totalTasks}`}
            footer={`${taskCompletionRate.toFixed(
              0
            )}%`}
            color={
              taskCompletionRate > 80
                ? "green"
                : "blue"
            }
          />

          <StatCard
            icon={CalendarCheck2}
            label="Appointments"
            value={`${attendedApps} / ${totalApps}`}
            footer={`${attendanceRate.toFixed(
              0
            )}%`}
            color={
              attendanceRate > 80
                ? "green"
                : "blue"
            }
          />

          <StatCard
            icon={AlertTriangle}
            label="Overdue Tasks"
            value={overdueTasks}
            footer="Action Required"
            color={
              overdueTasks > 0
                ? "red"
                : "green"
            }
          />

          <StatCard
            icon={Zap}
            label="Productivity Score"
            value={`${productivityScore}%`}
            footer={
              productivityScore > 80
                ? "Excellent"
                : "Good"
            }
            color={
              productivityScore > 80
                ? "green"
                : productivityScore > 60
                ? "blue"
                : "orange"
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Task Priority Distribution
              </CardTitle>

              <CardDescription>
                Breakdown of tasks by priority
                level.
              </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={barData}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    opacity={0.3}
                  />

                  <XAxis
                    type="number"
                    hide
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />

                  <Tooltip
                    cursor={{
                      fill: "#f3f4f6",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    fill="var(--color-bar)"
                    radius={[0, 4, 4, 0]}
                    barSize={25}
                    style={
                      {
                        "--color-bar":
                          "hsl(var(--primary))",
                      } as React.CSSProperties
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Weekly Activity Trend
              </CardTitle>

              <CardDescription>
                Completed tasks and attended
                appointments over the last 7 days.
              </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={weeklyActivity}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.2}
                  />

                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Legend
                    verticalAlign="top"
                    height={36}
                  />

                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed Tasks"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />

                  <Area
                    type="monotone"
                    dataKey="attended"
                    name="Attended Appointments"
                    stackId="1"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">
            Performance Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard
              icon={Award}
              title="High Priority Completion"
              value={`${highPriorityCompletionRate.toFixed(
                0
              )}%`}
            />

            <SummaryCard
              icon={TrendingUp}
              title="Weekly Productivity"
              value={`${productivityScore}%`}
            />

            <SummaryCard
              icon={AlertTriangle}
              title="Pending High-Priority"
              value={pendingHighPriority}
              color={
                pendingHighPriority > 0
                  ? "text-red-500"
                  : ""
              }
            />

            <SummaryCard
              icon={CheckCircle}
              title="Weekly Tasks Done"
              value={weeklyCompletedTasks}
            />

            <SummaryCard
              icon={Activity}
              title="This Week's Activity"
              value={thisWeekTotalActivity}
            />

            <SummaryCard
              icon={TrendingDown}
              title="Completion Trend"
              value="Stable"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  footer,
  color,
}: any) {
  const colorMap: any = {
    green:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",

    blue:
      "border-blue-500/20 bg-blue-500/10 text-blue-600",

    orange:
      "border-orange-500/20 bg-orange-500/10 text-orange-600",

    red:
      "border-red-500/20 bg-red-500/10 text-red-600",
  };

  return (
    <Card
      className={cn(
        "p-5 flex flex-col justify-between border-l-4 shadow-sm",
        colorMap[color]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">
          {label}
        </p>

        <Icon className="h-5 w-5 opacity-70" />
      </div>

      <div>
        <p className="text-3xl font-black">
          {value}
        </p>

        <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
          {footer}
        </p>
      </div>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  color,
}: any) {
  return (
    <Card className="p-4 flex items-center gap-4 bg-card border border-border/50 shadow-sm">
      <div className="p-2 bg-muted rounded-lg">
        <Icon
          className={cn(
            "h-5 w-5 text-muted-foreground",
            color
          )}
        />
      </div>

      <div>
        <p className="text-sm font-bold">
          {value}
        </p>

        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {title}
        </p>
      </div>
    </Card>
  );
}
