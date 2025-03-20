"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpCircle, MessageSquare } from "lucide-react";

export function NavSecondary() {
  return (
    <div className="mt-auto space-y-2 p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Appearance</p>
        <ThemeToggle />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Support</p>
        <Button variant="ghost" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          Support
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </div>
    </div>
  );
}
