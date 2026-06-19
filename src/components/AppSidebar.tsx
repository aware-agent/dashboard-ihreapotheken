import { useEffect } from "react";
import {
  ChevronUp,
  Loader2,
  LogOut,
  LayoutDashboard,
  FlaskConical,
  Zap,
  Upload,
  Dna,
  MessageSquarePlus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import IhreApothekenLogoSvg from "@/assets/ihreapotheken-apotheke-logo.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserProfile } from "@/hooks/useUser";
import { useLocale } from "@/hooks/useLocale";
import { useNavigate } from "@tanstack/react-router";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { useCookies } from "@/hooks/useCookies";
import { useQueryClient } from "@tanstack/react-query";

const navItems: Array<{
  titleKey: string;
  url: string;
  externalUrl?: string;
  icon: LucideIcon;
  matchPaths: string[];
}> = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard, matchPaths: ["/dashboard"] },
  { titleKey: "nav.results", url: "/history", icon: FlaskConical, matchPaths: ["/history", "/results", "/biomarkers"] },
  { titleKey: "nav.actions", url: "/actions", icon: Zap, matchPaths: ["/actions"] },
  { titleKey: "nav.uploads", url: "/uploads", icon: Upload, matchPaths: ["/uploads"] },
  { titleKey: "nav.bioAge", url: "/bio-age", icon: Dna, matchPaths: ["/bio-age"] },
  { titleKey: "nav.feedback", url: "", externalUrl: "https://ihreapotheken.de/feedback", icon: MessageSquarePlus, matchPaths: ["/feedback"] },
];

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function AppSidebar() {
  const { clearAuthCookies, isAuthenticated } = useCookies();
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useUserProfile();
  const { state, toggleSidebar } = useSidebar();
  const location = useRouterState({ select: (s) => s.location });
  const { t, locale } = useLocale();
  const isCollapsed = state === "collapsed";
  const { url: userShopUrl } = useUserShopUrl();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const isPathActive = (matchPaths: string[]) =>
    matchPaths.some((path) => location.pathname.startsWith(path));

  const userInitials = user
    ? `${user.givenName?.charAt(0) || ""}${user.familyName?.charAt(0) || ""}`.toUpperCase() || "U"
    : "U";
  const userName = user
    ? [user.givenName, user.familyName].filter(Boolean).join(" ") || user.email
    : "";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#E8E5E1] bg-white"
    >
      {/* Header */}
      <SidebarHeader className={`${isCollapsed ? "px-2 py-4" : "px-6 py-7"}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <img src={IhreApothekenLogoSvg} alt="IhreApotheken" className="h-12 w-auto max-w-[200px]" />
            <button
              onClick={() => toggleSidebar()}
              className="w-7 h-7 flex items-center justify-center rounded text-[#b0b0b0] hover:text-[#D32F2F] hover:bg-[#f0fae8] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10M2 7h10M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => toggleSidebar()}
            className="w-8 h-8 mx-auto flex items-center justify-center rounded text-[#b0b0b0] hover:text-[#D32F2F] hover:bg-[#f0fae8] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10M2 7h10M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </SidebarHeader>

      {/* Book Test CTA — top, prominent */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <a
            href={userShopUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#D32F2F] text-white text-sm font-semibold py-3 px-4 hover:bg-[#58a026] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("nav.bookTest")}
          </a>
        </div>
      )}
      {isCollapsed && (
        <div className="px-2 pb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={userShopUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 mx-auto rounded-xl bg-[#D32F2F] text-white hover:bg-[#58a026] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">{t("nav.bookTest")}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 mb-3 border-t border-[#f0f0f0]" />

      {/* Navigation */}
      <SidebarContent className={`${isCollapsed ? "px-2" : "px-3"} pt-0`}>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = isPathActive(item.matchPaths);
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.url} className={isCollapsed ? "flex justify-center" : ""}>
                    <SidebarMenuButton asChild tooltip={title}>
                      <Link
                        target={item.externalUrl ? "_blank" : undefined}
                        to={item.externalUrl ? item.externalUrl.replace("LANG", locale).toLowerCase() : item.url}
                        className={`flex items-center gap-3 rounded-lg text-sm transition-colors
                          ${isCollapsed ? "w-9 h-9 justify-center" : "px-3 py-2.5"}
                          ${isActive
                            ? "bg-[#FDEAEA] text-[#D32F2F] font-semibold border-l-2 border-[#D32F2F]"
                            : "text-[#787878] hover:text-[#2F2F2F] hover:bg-[#f7f7f7]"
                          }
                          ${item.externalUrl ? "text-[#b0b0b0] hover:text-[#787878]" : ""}
                        `}
                      >
                        <item.icon className={`shrink-0 h-[17px] w-[17px] ${isActive ? "text-[#D32F2F]" : "text-[#b0b0b0]"}`} />
                        {!isCollapsed && <span>{title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — User */}
      <SidebarFooter className={`mt-auto border-t border-[#f0f0f0] ${isCollapsed ? "p-2" : "p-3"}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={userName || "User menu"}
                  className={`w-full h-auto rounded-xl hover:bg-[#f7f7f7] transition-colors ${isCollapsed ? "p-1.5 justify-center" : "p-2.5"}`}
                >
                  {isUserLoading ? (
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 w-full"}`}>
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      {!isCollapsed && <div className="flex-1 space-y-1"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-3 w-28" /></div>}
                    </div>
                  ) : (
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 w-full"}`}>
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-[#D32F2F]/20">
                        <AvatarImage src={undefined} alt={userName} />
                        <AvatarFallback className="bg-[#FDEAEA] text-[#D32F2F] text-xs font-semibold">{userInitials}</AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <>
                          <div className="flex flex-col flex-1 min-w-0 text-left">
                            <span className="text-sm font-medium text-[#2F2F2F] truncate">{userName}</span>
                            <span className="text-xs text-[#b0b0b0] truncate">{user?.email}</span>
                          </div>
                          <ChevronUp className="h-3.5 w-3.5 text-[#c0c0c0] shrink-0" />
                        </>
                      )}
                    </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCollapsed ? "center" : "end"} side="top" sideOffset={8} className="w-60 rounded-xl p-2">
                <div className="px-3 py-3 mb-1 flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-[#D32F2F]/20">
                    <AvatarFallback className="bg-[#FDEAEA] text-[#D32F2F] font-semibold">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2F2F2F] truncate">{userName}</p>
                    <p className="text-xs text-[#b0b0b0] truncate">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg px-3 py-2"
                  onClick={() => { clearAuthCookies(); queryClient.clear(); navigate({ to: "/login", replace: true }); }}
                  disabled={!isAuthenticated()}
                >
                  {!isAuthenticated() ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  {!isAuthenticated() ? t("nav.loggingOut") : t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
