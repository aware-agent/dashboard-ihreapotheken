import { ReactNode, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ihreapothekenLogo from "@/assets/ihreapotheken-apotheke-logo.svg";

import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCookies } from "@/hooks/useCookies";

const SIDEBAR_STATE_KEY = "sidebar-open";

// Routes that should never show the sidebar
const PUBLIC_ROUTES = ["/", "/login"];

interface AppLayoutProps {
  children: ReactNode;
}

// Mobile header component that uses sidebar context
function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-background">
      <img src={ihreapothekenLogo} alt="IhreApotheken" className="h-5" />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useCookies();
  const location = useRouterState({ select: (s) => s.location });
  const searchParams = new URLSearchParams(location.search);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored !== null ? stored === "true" : true;
  });

  // Persist sidebar state to localStorage
  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
  };

  // Check if current route is a public route (landing page, auth)
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  // Only show sidebar layout for authenticated users on non-public routes
  const isLocal = import.meta.env.VITE_LOCAL === "true";
  if ((!isAuthenticated() && !isLocal) || isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarChange}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-background overflow-hidden">
          {/* Mobile Header with Hamburger Menu */}
          <MobileHeader />
          {/* Main Content */}
          <ErrorBoundary
            key={`${location.pathname}?${searchParams.toString()}`}
          >
            <main className="flex-1">{children}</main>
          </ErrorBoundary>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
