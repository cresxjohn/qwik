"use client";

import { WalletMinimal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenLoaderProps {
  message?: string;
  className?: string;
}

export function FullscreenLoader({
  message = "Loading...",
  className,
}: FullscreenLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <WalletMinimal className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>

        {/* App name and loading text */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold">Qwikfinx</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Loading spinner */}
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
        </div>
      </div>
    </div>
  );
}
