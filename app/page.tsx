"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WalletMinimal } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <WalletMinimal className="size-10" />
                </div>
                <span className="sr-only">Qwikfinx</span>
              </Link>
              <h1 className="text-xl font-bold">Welcome to Qwikfinx</h1>
              <div className="text-center text-sm">
                Simple yet functional expense tracker
              </div>
            </div>
            <div className="grid gap-4">
              <Link href="/login">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            By proceeding, you agree to our <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
