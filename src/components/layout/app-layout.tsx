"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  UserCircle,
  Menu,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-context";
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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [headerDate, setHeaderDate] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
    setHeaderDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
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
  // No default/lab identity: AppLayout only renders for a verified session.
  const userName = user?.displayName || user?.email || 'Account';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-body" dir="ltr">
        <Sidebar 
          side="left" 
          collapsible="icon" 
          className="border-r border-sidebar-border bg-slate-950 text-slate-100 w-64 shadow-2xl transition-all duration-300"
        >
          <SidebarHeader className="p-8 mb-4">
            <div className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xl ring-4 ring-primary/20">
                <span className="text-xl font-black">M</span>
              </div>
              <span className="text-xl font-black tracking-tight group-data-[collapsible=icon]:hidden">
                Munazzim
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4">
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={cn(
                      "flex items-center gap-4 py-6 px-4 rounded-xl transition-all duration-300",
                      pathname === item.href 
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                        : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                    )}
                  >
                    <a href={item.href}>
                      <item.icon className={cn("h-5 w-5 shrink-0")} />
                      <span className="text-sm font-black tracking-wide">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-6 border-t border-slate-800/50">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-16 w-full justify-start gap-4 px-2 hover:bg-slate-800 rounded-2xl transition-all">
                      <Avatar className="h-10 w-10 border-2 border-primary/40 shadow-lg">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="bg-primary text-white"><UserIcon className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-black truncate max-w-[120px]">{userName}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Workspace</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 mb-4 p-2 rounded-2xl shadow-2xl border-none">
                    <DropdownMenuLabel className="px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Account Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-4 px-4 py-3 cursor-pointer rounded-xl font-bold">
                      <UserCircle className="h-5 w-5 text-primary" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-4 px-4 py-3 cursor-pointer rounded-xl font-bold">
                      <Settings className="h-5 w-5 text-primary" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut} className="gap-4 px-4 py-3 cursor-pointer rounded-xl text-destructive font-bold focus:bg-destructive/10">
                      <LogOut className="h-5 w-5" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between px-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="hover:bg-slate-100 rounded-xl" />
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hidden md:block">
                {headerDate}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
