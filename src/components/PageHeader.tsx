import { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  preTitle?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children?: ReactNode;
  isLoading?: boolean;
  hideContentOnMobile?: boolean;
}

export function PageHeader({ preTitle, title, subtitle, breadcrumbs, children, isLoading, hideContentOnMobile }: PageHeaderProps) {
  return (
    <div className="pb-5 border-b border-[#E8E5E1]">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-[#b0b0b0]">
          <Link to="/dashboard" className="hover:text-[#D32F2F] transition-colors">Dashboard</Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="contents">
              <ChevronRight className="h-3 w-3" />
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-[#D32F2F] transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-[#787878] font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${hideContentOnMobile ? '' : ''}`}>
        <div className={`space-y-0.5 ${hideContentOnMobile ? 'hidden sm:block' : ''}`}>
          {preTitle && (
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#D32F2F] mb-2">{preTitle}</p>
          )}
          {isLoading && !title ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h1 className="text-2xl font-medium text-[#2F2F2F] leading-tight">{title}</h1>
          )}
          {isLoading && !subtitle ? (
            <Skeleton className="h-4 w-56 mt-1" />
          ) : subtitle ? (
            <p className="text-sm text-[#787878] mt-1">{subtitle}</p>
          ) : null}
        </div>
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
