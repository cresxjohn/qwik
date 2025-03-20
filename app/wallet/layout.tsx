import { AppSidebar } from "@/components/app-sidebar";
import ProtectedLayout from "@/components/ProtectedLayout";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <SidebarProvider>
        <AppSidebar />
        {children}
      </SidebarProvider>
    </ProtectedLayout>
  );
}
