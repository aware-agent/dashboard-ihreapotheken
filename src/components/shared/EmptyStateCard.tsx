import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestTube, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXTERNAL_URLS } from "@/config/urls";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

interface EmptyStateCardProps {
  title?: string;
  description?: string;
  showBookTest?: boolean;
  showUpload?: boolean;
  bookTestLabel?: string;
  uploadLabel?: string;
  className?: string;
}

export function EmptyStateCard({
  title = "No Results Yet",
  description = "Get started with your health journey by booking a blood test or uploading your existing results.",
  showBookTest = true,
  showUpload = true,
  bookTestLabel = "Book a Test",
  uploadLabel = "Upload Results",
  className,
}: EmptyStateCardProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <Card className={cn("", className)}>
      <CardContent className="py-16 text-center">
        <div className="p-4 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
          <TestTube className="h-8 w-8 text-primary" />
        </div>
        <h2 className="title-md text-foreground mb-2">{title}</h2>
        <p className="body-md text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {showBookTest && (
            <Button asChild size="lg" className="min-w-[160px]">
              <a
                href={userShopUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {bookTestLabel}
              </a>
            </Button>
          )}
          {showUpload && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              <Link to="/uploads">
                <Upload className="h-4 w-4 mr-2" />
                {uploadLabel}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact variant for inline use
interface CompactEmptyStateProps {
  message?: string;
  className?: string;
}

export function CompactEmptyState({
  message = "No data available",
  className,
}: CompactEmptyStateProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <div className={cn("text-center py-8", className)}>
      <div className="p-3 rounded-lg bg-muted/50 w-fit mx-auto mb-3">
        <TestTube className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="body-sm text-muted-foreground mb-3">{message}</p>
      <Button asChild size="sm">
        <a
          href={userShopUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <TestTube className="h-3.5 w-3.5 mr-1.5" />
          Book a Test
        </a>
      </Button>
    </div>
  );
}

// Greyed out placeholder card with CTA
interface PlaceholderCardProps {
  title: string;
  description?: string;
  className?: string;
}

export function PlaceholderCard({
  title,
  description = "Book a test to unlock this feature",
  className,
}: PlaceholderCardProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <Card
      className={cn(
        "border border-dashed border-border/60 bg-muted/20",
        className,
      )}
    >
      <CardContent className="p-6 text-center">
        <div className="opacity-40 mb-4">
          <div className="p-3 rounded-lg bg-muted w-fit mx-auto">
            <TestTube className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <h3 className="caption-md text-muted-foreground mb-1">{title}</h3>
        <p className="body-sm text-muted-foreground/70 mb-4">{description}</p>
        <Button asChild size="sm" variant="outline">
          <a
            href={userShopUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TestTube className="h-3.5 w-3.5 mr-1.5" />
            Book a Test
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
