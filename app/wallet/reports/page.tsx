"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background sm:rounded-4xl flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reports</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold mb-1">Reports</p>
                <p className="text-sm font-light">
                  View your financial reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
