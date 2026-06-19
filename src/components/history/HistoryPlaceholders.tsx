import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Activity,
  TrendingUp,
  TestTube,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/hooks/useLocale";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

// History page empty state - shows same layout structure with placeholders
export function HistoryEmptyState() {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <Tabs defaultValue="timeline" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
        <TabsTrigger
          value="timeline"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          {t("history.timeline")}
        </TabsTrigger>
        <TabsTrigger
          value="biomarkers"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Activity className="h-4 w-4 mr-2" />
          {t("history.biomarkers")}
        </TabsTrigger>
      </TabsList>

      {/* Timeline Tab - Placeholder */}
      <TabsContent value="timeline" className="space-y-6 mt-0">
        {/* Placeholder Chart */}
        <Card className="border border-dashed border-border/60 bg-muted/10">
          <CardContent className="p-6">
            {/* Fake chart area */}
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="w-full h-32 relative opacity-30">
                {/* Fake chart bars/lines */}
                <div className="absolute bottom-0 left-[10%] w-8 h-[40%] bg-muted rounded-t" />
                <div className="absolute bottom-0 left-[25%] w-8 h-[60%] bg-muted rounded-t" />
                <div className="absolute bottom-0 left-[40%] w-8 h-[45%] bg-muted rounded-t" />
                <div className="absolute bottom-0 left-[55%] w-8 h-[70%] bg-muted rounded-t" />
                <div className="absolute bottom-0 left-[70%] w-8 h-[55%] bg-muted rounded-t" />
                <div className="absolute bottom-0 left-[85%] w-8 h-[80%] bg-muted rounded-t" />
              </div>
              <div className="mt-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="caption-md text-muted-foreground mb-1">
                  {t("placeholders.noHealthScoreData")}
                </p>
                <p className="body-sm text-muted-foreground/70 mb-4">
                  {t("placeholders.trackHealthJourney")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TestTube className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="caption-md text-foreground">
                    {t("placeholders.startTracking")}
                  </p>
                  <p className="body-sm text-muted-foreground">
                    {t("placeholders.startTrackingDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild disabled={isUserShopUrlLoading}>
                  <a
                    href={userShopUrl.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {t("placeholders.bookATest")}
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/uploads">
                    <Upload className="h-4 w-4 mr-2" />
                    {t("common.uploadResults")}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Result Cards */}
        <div className="space-y-4">
          <p className="caption-md text-muted-foreground">
            {t("placeholders.recentResults")}
          </p>
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border border-dashed border-border/60 bg-muted/10"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-5 opacity-40">
                  <div className="w-14 h-14 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Biomarkers Tab - Placeholder */}
      <TabsContent value="biomarkers" className="space-y-6 mt-0">
        {/* Placeholder Summary Bar */}
        <Card className="border border-dashed border-border/60 bg-muted/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between opacity-40">
              <div className="flex items-center gap-4">
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
              </div>
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Biomarker List */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="border border-dashed border-border/60 bg-muted/10">
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 opacity-40"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="border border-dashed border-border/60 bg-muted/10">
              <CardContent className="p-6 text-center">
                <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="caption-md text-muted-foreground mb-1">
                  {t("placeholders.noBiomarkerData")}
                </p>
                <p className="body-sm text-muted-foreground/70 mb-4">
                  {t("placeholders.biomarkerDetailsWillAppear")}
                </p>
                <Button asChild size="sm" disabled={isUserShopUrlLoading}>
                  <a
                    href={userShopUrl.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TestTube className="h-3.5 w-3.5 mr-1.5" />
                    {t("placeholders.bookATest")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
