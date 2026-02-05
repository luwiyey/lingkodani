import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
          <Header />
          <div className="flex-1 p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
