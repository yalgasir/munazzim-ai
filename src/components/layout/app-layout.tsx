"use client";

import * as React from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarCheck, 
  CheckSquare, 
  BarChart3, 
  Sparkles, 
  Settings,
  User as UserIcon,
  LogOut,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Calendar", icon: CalendarDays, href: "/calendar" },
  { title: "Appointments", icon: CalendarCheck, href: "/appointments" },
  { title: "Tasks", icon: CheckSquare, href: "/tasks" },
  { title: "AI Assistant", icon: Sparkles, href: "/ai-assistant" },
  { title: "Statistics", icon: BarChart3, href: "/stats" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const userAvatar = (PlaceHolderImages || []).find(img => img.id === 'user-avatar')?.imageUrl;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" dir="ltr">
        <Sidebar side="left" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground w-64">
          <SidebarHeader className="p-6 flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <span className="text-xl font-black">M</span>
            </div>
            <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              Munazzim
            </span>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={cn(
                      "flex flex-row items-center gap-3 py-6 px-4 transition-all duration-200",
                      pathname === item.href ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <a href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-white" : "text-sidebar-foreground/70")} />
                      <span className="text-sm font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-14 w-full justify-start gap-3 px-2 hover:bg-sidebar-accent/50 transition-colors">
                      <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary"><UserIcon className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold truncate max-w-[120px]">Guest User</span>
                        <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">Local Workspace</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mb-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <UserCircle className="h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background overflow-auto">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="hover:bg-muted" />
            <div className="flex-1">
              <span className="text-xs font-medium text-muted-foreground hidden md:inline-block">
                {currentDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}