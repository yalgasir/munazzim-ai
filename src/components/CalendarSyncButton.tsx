"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncGoogleCalendar } from "@/lib/calendar-service";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

export function CalendarSyncButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSync = async () => {
    if (!user) return;
    
    setSyncing(true);
    setStatus("idle");
    
    try {
      const result = await syncGoogleCalendar(user.uid);
      if (result.success) {
        setStatus("success");
        toast({
          title: "Calendar Synchronized",
          description: `Imported ${result.count} new events from Google Calendar.`,
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      setStatus("error");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not connect to Google Calendar. Please check permissions.",
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSync} 
      disabled={syncing}
      className={cn(
        "gap-2 transition-all",
        status === "success" && "border-emerald-500 text-emerald-600",
        status === "error" && "border-destructive text-destructive"
      )}
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : status === "success" ? (
        <Check className="h-4 w-4" />
      ) : status === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {syncing ? "Syncing..." : status === "success" ? "Synced" : "Sync Calendar"}
    </Button>
  );
}
