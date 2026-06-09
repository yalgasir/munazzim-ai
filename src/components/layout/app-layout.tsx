"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarCheck, 
  CheckSquare, 
  BarChart3, 
  Sparkles, 
  Settings,
  User as UserIcon
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

const menuItems = [
  { title: "لوحة التحكم", icon: LayoutDashboard, href: "/" },
  { title: "التقويم", icon: CalendarDays, href: "/calendar" },
  { title: "المواعيد", icon: CalendarCheck, href: "/appointments" },
  { title: "المهام", icon: CheckSquare, href: "/tasks" },
  { title: "مساعد الذكاء الاصطناعي", icon: Sparkles, href: "/ai-assistant" },
  { title: "الإحصائيات", icon: BarChart3, href: "/stats" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
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

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar')?.imageUrl;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background" dir="rtl">
        <Sidebar side="right" collapsible="icon" className="border-l bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex flex-row items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary">
              <span className="text-xl font-bold">م</span>
            </div>
            <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
              منظّم
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="flex flex-row items-center gap-3 py-6 px-4"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden text-right">
                    <span className="text-sm font-medium">مستخدم عام</span>
                    <span className="text-xs text-sidebar-foreground/70">دخول مباشر</span>
                  </div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background overflow-auto">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
