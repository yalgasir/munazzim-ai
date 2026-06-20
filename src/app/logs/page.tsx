"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  RefreshCcw,
  ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const initialLogs = [
  { id: 1, type: "info", message: "Successfully logged in", time: "2 minutes ago", user: "Admin" },
  { id: 2, type: "success", message: "Schedule updated by AI Optimizer", time: "15 minutes ago", user: "Munazzim AI" },
  { id: 3, type: "warning", message: "Time conflict detected at 10:00 AM", time: "45 minutes ago", user: "System" },
  { id: 4, type: "success", message: "New task added: Review Report", time: "2 hours ago", user: "Admin" },
  { id: 5, type: "info", message: "Cloud data synchronization started", time: "Today 09:00 AM", user: "System" },
];

export default function LogsPage() {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.user.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6" dir="ltr">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-1 flex items-center gap-2">
              <History className="h-8 w-8 text-primary" />
              Activity Logs
            </h1>
            <p className="text-muted-foreground">Track all operations and changes in your account.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setLogs([...initialLogs])}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search logs..." 
            className="pl-10 text-left" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Recent Operations</CardTitle>
            <CardDescription>Total {filteredLogs.length} logs available.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {log.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
                          {log.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {log.type === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                          <span className="text-xs font-bold capitalize">
                            {log.type === "info" ? "Info" : log.type === "success" ? "Success" : "Warning"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{log.message}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <Badge variant="outline" className="bg-primary/5">{log.user}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{log.time}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground">
                        No logs match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

 