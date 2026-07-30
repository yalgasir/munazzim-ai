
"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Sparkles, LayoutList, CalendarPlus, CheckSquare, X } from "lucide-react";
import { AIAppointmentCreator } from "./ai-appointment-creator";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AddActions() {
  const [open, setOpen] = useState(false);

  const OptionCard = ({ icon: Icon, title, description, href, onClick, colorClass }: any) => {
    const Content = (
      <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group cursor-pointer w-full text-left">
        <div className={cn("p-3 rounded-xl text-white shadow-sm transition-transform group-hover:scale-110", colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-snug">{description}</p>
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="w-full" onClick={() => setOpen(false)}>
          {Content}
        </Link>
      );
    }

    return (
      <button className="w-full" onClick={onClick}>
        {Content}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Button */}
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 shadow-xl hover:scale-105 transition-transform px-8 h-12 text-lg font-bold">
              <Plus className="h-6 w-6" /> Add
            </Button>
          </DialogTrigger>
          <AddMenuContent setOpen={setOpen} OptionCard={OptionCard} />
        </Dialog>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary text-white hover:scale-110 active:scale-95 transition-all border-4 border-white">
              <Plus className="h-8 w-8" />
            </Button>
          </DialogTrigger>
          <AddMenuContent setOpen={setOpen} OptionCard={OptionCard} />
        </Dialog>
      </div>
    </>
  );
}

function AddMenuContent({ setOpen, OptionCard }: { setOpen: (o: boolean) => void, OptionCard: any }) {
  const [showAI, setShowAI] = useState(false);

  if (showAI) {
    return (
      <AIAppointmentCreator 
        customTrigger={false} 
        onClose={() => {
          setShowAI(false);
          setOpen(false);
        }} 
      />
    );
  }

  return (
    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
      <DialogHeader className="p-6 bg-primary text-white text-left">
        <div className="flex justify-between items-center">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Create New</DialogTitle>
        </div>
        <p className="text-primary-foreground/80 text-sm mt-1">Choose how you want to expand your workspace.</p>
      </DialogHeader>
      
      <div className="p-4 space-y-2">
        <div className="space-y-4">
          <div className="px-2">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Manual Entry</h5>
            <div className="grid grid-cols-1 gap-2">
              <OptionCard 
                icon={CalendarPlus} 
                title="Appointment" 
                description="Schedule a meeting or event manually." 
                href="/appointments?add=true"
                colorClass="bg-blue-600"
              />
              <OptionCard 
                icon={CheckSquare} 
                title="Task" 
                description="Create a single to-do item for your list." 
                href="/tasks?add=true"
                colorClass="bg-emerald-600"
              />
            </div>
          </div>

          <div className="h-px bg-border mx-2" />

          <div className="px-2">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Cognitive Assistant</h5>
            <OptionCard 
              icon={Sparkles} 
              title="Use AI Assistant" 
              description="Describe your request in natural language and let AI create it for you." 
              onClick={() => setShowAI(true)}
              colorClass="bg-purple-600"
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-muted/30 border-t flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground gap-2">
          <X className="h-4 w-4" /> Close
        </Button>
      </div>
    </DialogContent>
  );
}
