import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { formatShortDate } from '@/lib/dateUtils';

// Base article interface that works with both Article types
interface BaseArticle {
  id: string;
  url: string;
  title: string;
  image?: string | null;
  tags: string[];
  publishedAt?: string;
  createdAt?: string;
}

function useArticleDate(article: BaseArticle): string | null {
  const { locale } = useLocale();
  const dateStr = article.publishedAt || article.createdAt;
  if (!dateStr) return null;
  try {
    return formatShortDate(dateStr, locale);
  } catch {
    return null;
  }
}

interface ArticleCardProps {
  article: BaseArticle;
  variant?: 'card' | 'compact' | 'list';
  className?: string;
}

export function ArticleCard({ article, variant = 'card', className }: ArticleCardProps) {
  if (variant === 'list') {
    return <ArticleListItem article={article} className={className} />;
  }

  if (variant === 'compact') {
    return <ArticleCompactCard article={article} className={className} />;
  }

  return <ArticleGridCard article={article} className={className} />;
}

// Skeleton loading states for each variant
interface ArticleCardSkeletonProps {
  variant?: 'card' | 'compact' | 'list';
  className?: string;
}

export function ArticleCardSkeleton({ variant = 'card', className }: ArticleCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4 shrink-0" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <Skeleton className="aspect-video w-full" />
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-1 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default 'card' variant skeleton
  return (
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="h-32 w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}

// Grid card variant - used on Dashboard
function ArticleGridCard({ article, className }: { article: BaseArticle; className?: string }) {
  const articleDate = useArticleDate(article);
  
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block group/article", className)}
    >
      <div className="relative rounded-2xl overflow-hidden h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ background: 'linear-gradient(145deg, #1a1a1a 0%, #0d1a0d 100%)', minHeight: '180px' }}>
        {article.image && (
          <div className="absolute inset-0">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover opacity-30 group-hover/article:opacity-40 transition-opacity duration-500"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 100%)' }} />
          </div>
        )}
        <div className="relative z-10 p-5 flex flex-col justify-between h-full" style={{ minHeight: '180px' }}>
          {article.tags.length > 0 && (
            <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
              style={{ background: 'rgba(101,179,46,0.25)', color: '#a8d97a', backdropFilter: 'blur(4px)' }}>
              {article.tags[0]}
            </span>
          )}
          <div>
            <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '15px', fontWeight: 400, color: 'white', lineHeight: 1.45, marginBottom: '8px' }}
              className="line-clamp-3">
              {article.title}
            </h3>
            {articleDate && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{articleDate}</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

// Compact card variant - used in Health Zone detail
function ArticleCompactCard({ article, className }: { article: BaseArticle; className?: string }) {
  const articleDate = useArticleDate(article);
  
  return (
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn("block group", className)}
    >
      <Card className="border-0 shadow-none bg-card hover:shadow-md transition-all h-full">
        <CardContent className="p-3">
          {article.image && (
            <div className="aspect-video overflow-hidden rounded-lg mb-3">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {article.tags.filter(Boolean).slice(0, 2).map((tag) => (
                <span 
                  key={tag} 
                  className="text-xs px-2.5 py-1 rounded-full text-[#6B4EFF] font-medium"
                  style={{ backgroundColor: '#EFEBFF' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {articleDate && (
            <span className="text-xs text-muted-foreground mt-2 block">
              {articleDate}
            </span>
          )}
        </CardContent>
      </Card>
    </a>
  );
}

// List item variant - used in Biomarker detail sidebar
function ArticleListItem({ article, className }: { article: BaseArticle; className?: string }) {
  const articleDate = useArticleDate(article);
  
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block", className)}
    >
      <Card className="border-0 shadow-none bg-card hover:shadow-sm transition-all group">
        <CardContent className="p-3 flex items-center gap-3">
          {article.image && (
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="caption-md text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {article.tags.slice(0, 2).map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2 py-0.5 rounded-full text-[#6B4EFF] font-medium"
                    style={{ backgroundColor: '#EFEBFF' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {articleDate && (
              <span className="text-xs text-muted-foreground mt-1.5 block">
                {articleDate}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// Articles Section Component for reuse
interface ArticlesSectionProps {
  articles: BaseArticle[];
  title?: string;
  variant?: 'card' | 'compact' | 'list';
  maxItems?: number;
  gridCols?: 'auto' | 2 | 3 | 4;
  isLoading?: boolean;
  className?: string;
}

export function ArticlesSection({ 
  articles, 
  title = 'Related Articles',
  variant = 'card',
  maxItems = 4,
  gridCols = 'auto',
  isLoading = false,
  className 
}: ArticlesSectionProps) {
  const getGridClass = () => {
    if (variant === 'list') return 'space-y-3';
    
    switch (gridCols) {
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      case 4:
        return 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      default:
        return 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
    }
  };

  if (isLoading) {
    return (
      <section className={className}>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className={getGridClass()}>
          {Array.from({ length: maxItems }).map((_, i) => (
            <ArticleCardSkeleton key={i} variant={variant} />
          ))}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) return null;

  const displayArticles = articles.slice(0, maxItems);

  return (
    <section className={className}>
      <h2 className="title-md text-foreground mb-4">
        {title}
      </h2>
      <div className={getGridClass()}>
        {displayArticles.map((article) => (
          <ArticleCard key={article.id} article={article} variant={variant} />
        ))}
      </div>
    </section>
  );
}
