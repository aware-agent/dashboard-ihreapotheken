import { ReactNode } from 'react';
import { PageHeader, BreadcrumbItem } from '@/components/PageHeader';
import { PageTransition } from '@/components/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLayoutProps {
  children: ReactNode;
  preTitle?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Optional actions to display in the header (buttons, etc.) */
  headerActions?: ReactNode;
  /** Max width class - defaults to max-w-7xl */
  maxWidth?: string;
  /** Show loading skeleton instead of children */
  isLoading?: boolean;
  /** Custom skeleton component to render when loading */
  loadingSkeleton?: ReactNode;
  /** Hide header content on mobile (for edit modes) */
  hideHeaderContentOnMobile?: boolean;
}

export function PageLayout({
  children,
  preTitle,
  title,
  subtitle,
  breadcrumbs,
  headerActions,
  maxWidth = 'max-w-none',
  isLoading = false,
  loadingSkeleton,
  hideHeaderContentOnMobile = false,
}: PageLayoutProps) {
  return (
    <PageTransition className="min-h-screen bg-[#F7F5F2]">
      <div className={`w-full px-10 md:px-16 py-8 md:py-10 space-y-12 ${maxWidth} mx-auto`}>
        {title && (
          <PageHeader
            preTitle={preTitle}
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
            isLoading={isLoading}
            hideContentOnMobile={hideHeaderContentOnMobile}
          >
            {headerActions}
          </PageHeader>
        )}
        {isLoading ? (loadingSkeleton || <DefaultPageSkeleton />) : children}
      </div>
    </PageTransition>
  );
}

export function DefaultPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
